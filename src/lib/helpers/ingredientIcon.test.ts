import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ingredientIcon } from './ingredientIcon';

const FALLBACK_TINT = 'bg-muted';

describe('ingredientIcon', () => {
	it('matches a curated keyword', () => {
		expect(ingredientIcon('losos', 'chladené výrobky').emoji).toBe('🐟');
		expect(ingredientIcon('cesnak', 'zelenina').emoji).toBe('🧄');
		expect(ingredientIcon('mrkva', 'zelenina').emoji).toBe('🥕');
	});

	it('is diacritic-insensitive', () => {
		expect(ingredientIcon('cibuľa', 'zelenina').emoji).toBe(
			ingredientIcon('cibula', 'zelenina').emoji
		);
		expect(ingredientIcon('Čučoriedky', 'ovocie').emoji).toBe('🫐');
		// Case and surrounding whitespace must not matter either.
		expect(ingredientIcon('  MRKVA  ', 'zelenina').emoji).toBe('🥕');
	});

	it('lets the longest keyword win over a generic one', () => {
		// „maslo" is butter; „arašidové maslo" is peanut butter.
		expect(ingredientIcon('maslo', 'mliečné výrobky').emoji).toBe('🧈');
		expect(ingredientIcon('arašidové maslo', 'omáčky').emoji).toBe('🥜');
		expect(ingredientIcon('arašidové maslo', 'omáčky').emoji).not.toBe(
			ingredientIcon('maslo', 'mliečné výrobky').emoji
		);

		// „kokosové mlieko" is a coconut, not a carton of milk.
		expect(ingredientIcon('mlieko', 'mliečné výrobky').emoji).toBe('🥛');
		expect(ingredientIcon('kokosové mlieko light', 'konzervy').emoji).toBe('🥥');

		// The plan's example: „jarná cibuľka" reads differently from „cibuľa".
		expect(ingredientIcon('cibuľa', 'zelenina').emoji).toBe('🧅');
		expect(ingredientIcon('jarná cibulka', 'zelenina').emoji).not.toBe(
			ingredientIcon('cibuľa', 'zelenina').emoji
		);

		// „makrela" must not be mistaken for „mak" (poppy seed).
		expect(ingredientIcon('makrela', 'chladené výrobky').emoji).toBe('🐟');
		expect(ingredientIcon('mletý mak', 'iné').emoji).toBe('🌱');
	});

	it('takes the tint from the product type, not the keyword', () => {
		// Same emoji, different taxonomy bucket → different colour family, so a
		// section of rows still reads as one family.
		const fresh = ingredientIcon('losos', 'chladené výrobky');
		const frozen = ingredientIcon('losos', 'mrazené výrobky');
		expect(fresh.emoji).toBe(frozen.emoji);
		expect(fresh.tint).not.toBe(frozen.tint);
	});

	it('falls back to the product type when no keyword matches', () => {
		const icon = ingredientIcon('niečo úplne neznáme', 'zelenina');
		expect(icon.emoji).toBe('🥬');
		expect(icon.tint).not.toBe(FALLBACK_TINT);
	});

	it('still returns an emoji for an unknown name and unknown type', () => {
		const icon = ingredientIcon('niečo úplne neznáme', 'nejaká nová kategória');
		expect(icon.emoji).not.toBe('');
		expect(icon.tint).toBe(FALLBACK_TINT);

		const noType = ingredientIcon('niečo úplne neznáme');
		expect(noType.emoji).not.toBe('');
	});

	it('never returns a blank tile for any ingredient in the corpus', () => {
		const blueprint = JSON.parse(readFileSync('seed/blueprint.json', 'utf8')) as {
			ingredientsByCode: Record<string, Array<{ name: string; productType: string }>>;
		};
		const blanks: string[] = [];
		for (const list of Object.values(blueprint.ingredientsByCode)) {
			for (const ingredient of list) {
				const icon = ingredientIcon(ingredient.name, ingredient.productType);
				if (icon.emoji.trim() === '' || icon.tint.trim() === '') {
					blanks.push(ingredient.name);
				}
			}
		}
		expect(blanks).toEqual([]);
	});

	it('resolves every blueprint productType to a non-fallback tint', () => {
		const blueprint = JSON.parse(readFileSync('seed/blueprint.json', 'utf8')) as {
			productTypes: string[];
		};
		const unmapped = blueprint.productTypes.filter(
			// A name that matches no keyword exposes the raw product-type entry.
			(productType) =>
				ingredientIcon('zzz-nic-taketo-neexistuje', productType).tint === FALLBACK_TINT
		);
		expect(unmapped).toEqual([]);
	});

	it('maps the pantry fallback product type too', () => {
		// `pantry.add` assigns `ostatné` when a name matches no recipe.
		expect(ingredientIcon('zzz-nic-taketo-neexistuje', 'ostatné').tint).not.toBe(FALLBACK_TINT);
	});
});
