import { browser } from '$app/environment';
import {
	MeetingLanguageCode,
	type MeetingLanguageCode as Locale,
	type LanguageConfigEntry,
	type TextDirection,
	DEFAULT_MEETING_LANGUAGE_CODE
} from '$lib/schemas';
import { log } from '$lib/helpers/logger';

/**
 * Add languages here as needed. Each entry must:
 *  1. exist in `MeetingLanguageCode` enum (src/lib/schemas/schemas.ts)
 *  2. have a `dir` of either `'ltr'` or `'rtl'`
 *  3. have a `flag` (emoji) and `label` (display name in that language)
 *
 * The dictionary in `src/lib/dictionary/dictionary.ts` must also be
 * extended for every new locale you add — every key needs an entry per
 * language code.
 */
const languageConfig: Record<Locale, LanguageConfigEntry> = {
	en_us: { label: 'English (United States)', flag: '🇺🇸', dir: 'ltr' }
};

class LangStoreClass {
	locale = $state<Locale>(DEFAULT_MEETING_LANGUAGE_CODE);
	direction = $derived<TextDirection>(languageConfig[this.locale].dir);

	get config() {
		return languageConfig;
	}

	get currentLabel() {
		return languageConfig[this.locale].label;
	}

	get currentFlag() {
		return languageConfig[this.locale].flag;
	}

	init(): void {
		if (!browser) return;

		const storedLocale = localStorage.getItem('lang.locale');

		if (storedLocale) {
			const { success, data, error: err } = MeetingLanguageCode.safeParse(storedLocale);
			if (success) {
				this.locale = data;
				log.debug({ lang: data }, 'Language loaded from localStorage');
			} else {
				log.warn(
					{ validationError: err },
					'Stored language value is invalid, using browser preference'
				);
				this.detectBrowserLanguage();
			}
		} else {
			this.detectBrowserLanguage();
		}

		this.applyLanguage();
	}

	set(value: Locale): void {
		this.locale = value;
		this.applyLanguage();

		if (browser) {
			localStorage.setItem('lang.locale', this.locale);
			log.debug({ locale: this.locale }, 'Language saved to localStorage');
		}
	}

	setLocale(value: Locale): void {
		this.set(value);
	}

	private detectBrowserLanguage(): void {
		if (!browser) return;

		const normalizedBrowserLocale = navigator.language.toLowerCase().replace('-', '_');
		const parsedLocale = MeetingLanguageCode.safeParse(normalizedBrowserLocale);
		const preferredLocale = parsedLocale.success
			? parsedLocale.data
			: DEFAULT_MEETING_LANGUAGE_CODE;

		this.locale = preferredLocale;
		log.debug({ locale: preferredLocale }, 'Using browser language preference');
	}

	private applyLanguage(): void {
		if (!browser) return;
		const html = document.documentElement;
		html.lang = this.locale.replace('_', '-');
		html.dir = languageConfig[this.locale].dir;
	}
}

export const langStore = new LangStoreClass();
