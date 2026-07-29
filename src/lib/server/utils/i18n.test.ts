import { describe, expect, it } from 'vitest';
import {
	getRequestTranslator,
	resolveDictionaryLang,
	translateDictionaryValue,
	type DictionaryKey
} from './i18n';

describe('resolveDictionaryLang', () => {
	it('returns fallback when header is missing', () => {
		expect(resolveDictionaryLang(undefined, 'en_us')).toBe('en_us');
		expect(resolveDictionaryLang(null, 'en_us')).toBe('en_us');
	});

	it('returns fallback for unsupported language tags', () => {
		expect(resolveDictionaryLang('xx-YY,xx;q=0.9', 'en_us')).toBe('en_us');
	});
});

describe('translateDictionaryValue', () => {
	it('returns a string for the configured language', () => {
		const value = translateDictionaryValue('appTitle' as DictionaryKey, 'en_us');
		expect(typeof value).toBe('string');
	});
});

describe('getRequestTranslator', () => {
	it('uses fallback language when accept-language is unavailable', () => {
		const request = new Request('https://example.com');
		const t = getRequestTranslator(request, 'en_us');

		const translated = t('appTitle' as DictionaryKey);
		expect(typeof translated).toBe('string');
	});
});
