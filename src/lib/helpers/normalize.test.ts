import { describe, expect, it } from 'vitest';
import { normalizeName, slugify, stripDiacritics, stripKcalSuffix } from './normalize';

describe('stripDiacritics', () => {
	it('strips Slovak diacritics', () => {
		expect(stripDiacritics('Čučoriedková')).toBe('Cucoriedkova');
		expect(stripDiacritics('žĺtok šťava ťažký ďateľ')).toBe('zltok stava tazky datel');
	});
});

describe('normalizeName', () => {
	it('lowercases, trims, collapses whitespace and strips diacritics', () => {
		expect(normalizeName('  Jazmínová   RYŽA ')).toBe('jazminova ryza');
	});

	it('makes pantry matching diacritic-insensitive', () => {
		expect(normalizeName('cibuľa')).toBe(normalizeName('Cibula'));
	});
});

describe('stripKcalSuffix', () => {
	it('removes dash-separated kcal suffixes', () => {
		expect(stripKcalSuffix('Thajské kari — 400 kcal')).toBe('Thajské kari');
		expect(stripKcalSuffix('Thajské kari - 500 kcal')).toBe('Thajské kari');
		expect(stripKcalSuffix('Thajské kari – 600 kcal')).toBe('Thajské kari');
	});

	it('removes parenthesised and bare kcal suffixes', () => {
		expect(stripKcalSuffix('Poké bowl (400 kcal)')).toBe('Poké bowl');
		expect(stripKcalSuffix('Poké bowl 600kcal')).toBe('Poké bowl');
	});

	it('leaves titles without a kcal marker alone', () => {
		expect(stripKcalSuffix('Wrap na 6 spôsobov')).toBe('Wrap na 6 spôsobov');
	});
});

describe('slugify', () => {
	it('produces a url-safe slug and merges kcal variants to one slug', () => {
		expect(slugify('Thajské kari — 400 kcal')).toBe('thajske-kari');
		expect(slugify('Thajské kari — 600 kcal')).toBe('thajske-kari');
	});

	it('handles punctuation and numbers', () => {
		expect(slugify('Wrap na 6 spôsobov')).toBe('wrap-na-6-sposobov');
		expect(slugify('„Zdravé" brownies!')).toBe('zdrave-brownies');
	});
});
