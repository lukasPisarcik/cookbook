import { describe, expect, it } from 'vitest';
import { RecipeSeedSchema } from './schemas';

const validSeed = {
	title: 'Thajské kari',
	category: 'obedy',
	dietTags: ['bezlaktozove'],
	prepTimeMinutes: 30,
	steps: ['Ryžu uvar podľa návodu.', 'Kari restuj 10 minút.'],
	funFact: 'Vedela si, že kari pasta obsahuje galangal?',
	variants: [
		{
			label: '400 kcal',
			kcalPerPortion: 391,
			portions: 5,
			macros: { carbs: 45, protein: 24, fat: 5 },
			ingredients: [
				{ name: 'jazmínová ryža', quantity: 200, unit: 'g', productType: 'prílohy' },
				{ name: 'morčacie prsia', quantity: 400, unit: 'g', productType: 'mäso' }
			]
		}
	],
	image: 'thajske-kari.webp',
	source: 'Thajské kari - 400 kcal.pdf',
	sourceRef: 'R12'
};

describe('RecipeSeedSchema', () => {
	it('accepts a realistic extracted sample', () => {
		const result = RecipeSeedSchema.safeParse(validSeed);
		expect(result.success).toBe(true);
	});

	it('rejects a missing category', () => {
		const { category: _category, ...rest } = validSeed;
		expect(RecipeSeedSchema.safeParse(rest).success).toBe(false);
	});

	it('rejects an unknown category', () => {
		expect(RecipeSeedSchema.safeParse({ ...validSeed, category: 'polievky' }).success).toBe(false);
	});

	it('rejects a variant with no ingredients', () => {
		const seed = {
			...validSeed,
			variants: [{ ...validSeed.variants[0], ingredients: [] }]
		};
		expect(RecipeSeedSchema.safeParse(seed).success).toBe(false);
	});

	it('rejects absurd kcal values', () => {
		const low = {
			...validSeed,
			variants: [{ ...validSeed.variants[0], kcalPerPortion: 20 }]
		};
		const high = {
			...validSeed,
			variants: [{ ...validSeed.variants[0], kcalPerPortion: 4000 }]
		};
		expect(RecipeSeedSchema.safeParse(low).success).toBe(false);
		expect(RecipeSeedSchema.safeParse(high).success).toBe(false);
	});

	it('rejects an empty variants array', () => {
		expect(RecipeSeedSchema.safeParse({ ...validSeed, variants: [] }).success).toBe(false);
	});

	it('defaults dietTags to an empty array when absent', () => {
		const { dietTags: _dietTags, ...rest } = validSeed;
		const result = RecipeSeedSchema.safeParse(rest);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.dietTags).toEqual([]);
	});
});
