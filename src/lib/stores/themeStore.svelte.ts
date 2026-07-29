import { browser } from '$app/environment';
import { ThemeSchema, type Theme, log } from '$lib';

class ThemeStoreClass {
	current = $state<Theme>('light');

	private userHasSetTheme = false;

	init(): void {
		if (!browser) return;

		const stored = localStorage.getItem('theme');
		const media = window.matchMedia('(prefers-color-scheme: dark)');

		// Check if user has previously set a theme
		if (stored) {
			const { success, data, error: err } = ThemeSchema.safeParse(stored);
			if (success) {
				this.current = data;
				this.userHasSetTheme = true;
				log.debug({ theme: data }, 'Theme loaded from localStorage');
			} else {
				log.warn(
					{ validationError: err },
					'Stored theme value is invalid, using system preference'
				);
				this.current = this.getSystemTheme();
			}
		} else {
			// No stored preference, use system default
			this.current = this.getSystemTheme();
			log.debug({ theme: this.current }, 'Using system theme preference');
		}

		this.applyTheme();

		// Listen for system preference changes (only apply if user hasn't set a preference)
		media.addEventListener('change', () => {
			if (!this.userHasSetTheme) {
				this.current = this.getSystemTheme();
				this.applyTheme();
				log.debug({ theme: this.current }, 'System theme preference changed');
			}
		});
	}

	set(value: Theme): void {
		const { success, data, error: err } = ThemeSchema.safeParse(value);
		if (!success) {
			const errorId = crypto.randomUUID();
			log.warn({ errorId, validationError: err }, 'Invalid theme value');
			return;
		}

		this.current = data;
		this.userHasSetTheme = true;
		this.applyTheme();

		if (browser) {
			localStorage.setItem('theme', this.current);
			log.debug({ theme: this.current }, 'Theme saved to localStorage');
		}
	}

	toggle(): void {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}

	private getSystemTheme(): Theme {
		if (!browser) return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	private applyTheme(): void {
		if (!browser) return;

		const html = document.documentElement;
		html.dataset.theme = this.current;
	}
}

export const themeStore = new ThemeStoreClass();
