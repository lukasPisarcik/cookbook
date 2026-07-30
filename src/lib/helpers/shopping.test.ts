import { describe, expect, it } from 'vitest';
import { aggregateShoppingList, groupByProductType, type FlaggedRecipe } from './shopping';

function recipe(slug: string, overrides: Partial<FlaggedRecipe> = {}): FlaggedRecipe {
	return {
		slug,
		portionMultiplier: 1,
		ingredients: [],
		...overrides
	};
}

describe('aggregateShoppingList', () => {
	it('sums quantities for the same name + unit across recipes', () => {
		const items = aggregateShoppingList(
			[
				recipe('kari', {
					ingredients: [
						{ name: 'jazmínová ryža', quantity: 200, unit: 'g', productType: 'prílohy' }
					]
				}),
				recipe('poke', {
					ingredients: [
						{ name: 'Jazmínová Ryža', quantity: 150, unit: 'g', productType: 'prílohy' }
					]
				})
			],
			[]
		);
		expect(items).toHaveLength(1);
		expect(items[0].quantity).toBe(350);
		expect(items[0].recipeSlugs).toEqual(['kari', 'poke']);
	});

	it('keeps different units of the same ingredient separate', () => {
		const items = aggregateShoppingList(
			[
				recipe('a', {
					ingredients: [
						{ name: 'mlieko', quantity: 200, unit: 'ml', productType: 'mliečne výrobky' },
						{ name: 'mlieko', quantity: 1, unit: 'ks', productType: 'mliečne výrobky' }
					]
				})
			],
			[]
		);
		expect(items).toHaveLength(2);
	});

	it('applies the portion multiplier', () => {
		const items = aggregateShoppingList(
			[
				recipe('kari', {
					portionMultiplier: 2,
					ingredients: [{ name: 'morčacie prsia', quantity: 400, unit: 'g', productType: 'mäso' }]
				})
			],
			[]
		);
		expect(items[0].quantity).toBe(800);
	});

	it('keeps quantity undefined when no occurrence has an amount', () => {
		const items = aggregateShoppingList(
			[
				recipe('a', { ingredients: [{ name: 'soľ', productType: 'korenie' }] }),
				recipe('b', { ingredients: [{ name: 'soľ', productType: 'korenie' }] })
			],
			[]
		);
		expect(items).toHaveLength(1);
		expect(items[0].quantity).toBeUndefined();
	});

	it('marks pantry items excluded (diacritic-insensitively)', () => {
		const items = aggregateShoppingList(
			[
				recipe('a', {
					ingredients: [
						{ name: 'Cibuľa', quantity: 2, unit: 'ks', productType: 'zelenina' },
						{ name: 'paprika', quantity: 220, unit: 'g', productType: 'zelenina' }
					]
				})
			],
			['cibula']
		);
		const onion = items.find((item) => item.nameNorm === 'cibula');
		const pepper = items.find((item) => item.nameNorm === 'paprika');
		expect(onion?.excludedByPantry).toBe(true);
		expect(pepper?.excludedByPantry).toBe(false);
	});
});

describe('groupByProductType', () => {
	it('groups items under their product type with items sorted by name', () => {
		const groups = groupByProductType([
			{ name: 'tvaroh', productType: 'mliečne výrobky' },
			{ name: 'cibuľa', productType: 'zelenina' },
			{ name: 'avokádo', productType: 'zelenina' }
		]);
		expect(groups.map((group) => group.productType)).toEqual(['mliečne výrobky', 'zelenina']);
		expect(groups[1].items.map((item) => item.name)).toEqual(['avokádo', 'cibuľa']);
	});
});
