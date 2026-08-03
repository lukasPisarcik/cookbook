import { describe, expect, it } from 'vitest';
import {
	computeCorpusAggregates,
	FREQUENT_LIMIT,
	type AggregatableRecipe,
	type CorpusIngredient
} from './corpus';

function ingredient(name: string, productType = 'ostatné'): CorpusIngredient {
	// The corpus always carries a precomputed nameNorm; the helper never
	// normalizes, so the fixtures must supply it the way the importer does.
	return { name, nameNorm: name.toLowerCase(), productType };
}

let slugCounter = 0;
function recipe(
	dietTags: string[],
	variants: CorpusIngredient[][] = [[]],
	slug = `recipe-${slugCounter++}`
): AggregatableRecipe {
	return { slug, dietTags, variants: variants.map((ingredients) => ({ ingredients })) };
}

describe('computeCorpusAggregates', () => {
	it('deduplicates diet tags and sorts them with Slovak collation', () => {
		const result = computeCorpusAggregates([
			recipe(['vegan', 'bezlepkove']),
			recipe(['vegan', 'vegetarianske']),
			recipe(['bezlaktozove'])
		]);
		expect(result.dietTags).toEqual(['bezlaktozove', 'bezlepkove', 'vegan', 'vegetarianske']);
	});

	it('deduplicates known ingredients by nameNorm, first occurrence winning', () => {
		const result = computeCorpusAggregates([
			recipe([], [[ingredient('Cibuľa', 'zelenina')]]),
			// Same nameNorm, different spelling and type — must not create a second
			// entry, and must not overwrite the first one's metadata.
			recipe([], [[{ name: 'CIBUĽA', nameNorm: 'cibuľa', productType: 'ostatné' }]])
		]);
		expect(result.knownIngredients).toEqual([
			{ name: 'Cibuľa', nameNorm: 'cibuľa', productType: 'zelenina' }
		]);
	});

	it('sorts known ingredients by display name with Slovak collation', () => {
		const result = computeCorpusAggregates([
			recipe([], [[ingredient('šalát'), ingredient('avokádo'), ingredient('cibuľa')]])
		]);
		expect(result.knownIngredients.map((entry) => entry.name)).toEqual([
			'avokádo',
			'cibuľa',
			'šalát'
		]);
	});

	it('counts a name repeated across variants of one recipe only once', () => {
		// This is the whole point of the per-recipe `seen` set: the 400/500/600
		// kcal variants of one dish repeat most of the same ingredients.
		const result = computeCorpusAggregates([
			recipe([], [[ingredient('ryža')], [ingredient('ryža')], [ingredient('ryža')]]),
			recipe([], [[ingredient('tofu')]])
		]);
		expect(result.frequentIngredients.map((entry) => entry.name)).toEqual(['ryža', 'tofu']);
	});

	it('orders frequent ingredients by count, breaking ties on name', () => {
		const result = computeCorpusAggregates([
			recipe([], [[ingredient('ryža'), ingredient('zemiaky'), ingredient('avokádo')]]),
			recipe([], [[ingredient('ryža'), ingredient('zemiaky')]]),
			recipe([], [[ingredient('ryža')]])
		]);
		// ryža 3, zemiaky 2, avokádo 1.
		expect(result.frequentIngredients.map((entry) => entry.name)).toEqual([
			'ryža',
			'zemiaky',
			'avokádo'
		]);
	});

	it('breaks an equal count on the display name, not on insertion order', () => {
		const result = computeCorpusAggregates([
			recipe([], [[ingredient('zemiaky'), ingredient('avokádo')]])
		]);
		expect(result.frequentIngredients.map((entry) => entry.name)).toEqual(['avokádo', 'zemiaky']);
	});

	it(`caps frequent ingredients at ${FREQUENT_LIMIT} while known stays complete`, () => {
		// 50 distinct ingredients, descending frequency: ing-00 appears in 50
		// recipes, ing-49 in one.
		const recipes = Array.from({ length: 50 }, (_, index) =>
			recipe(
				[],
				[
					Array.from({ length: 50 - index }, (_, n) =>
						ingredient(`ing-${String(n).padStart(2, '0')}`)
					)
				]
			)
		);
		const result = computeCorpusAggregates(recipes);
		expect(result.frequentIngredients).toHaveLength(FREQUENT_LIMIT);
		expect(result.knownIngredients).toHaveLength(50);
		expect(result.frequentIngredients[0].name).toBe('ing-00');
		expect(result.frequentIngredients.at(-1)?.name).toBe(`ing-${FREQUENT_LIMIT - 1}`);
	});

	it('returns empty arrays (never undefined) for an empty corpus', () => {
		const result = computeCorpusAggregates([]);
		expect(result).toEqual({
			recipeCount: 0,
			dietTags: [],
			dietTagSlugs: [],
			knownIngredients: [],
			frequentIngredients: []
		});
	});

	it('reports the corpus size it was computed from', () => {
		expect(computeCorpusAggregates([recipe([]), recipe([])]).recipeCount).toBe(2);
	});
});

/**
 * `dietTagSlugs` is what lets the diet chips resolve a bounded slug list
 * instead of scanning all 635 card rows, so its grouping has to be exactly
 * right: a slug missing from a tag silently reads as „no such recipes" in the
 * UI rather than as a fault.
 */
describe('computeCorpusAggregates — dietTagSlugs', () => {
	it('groups slugs under every tag they carry', () => {
		const result = computeCorpusAggregates([
			recipe(['vegan'], [[]], 'tofu-kari'),
			recipe(['vegan', 'bezlepkove'], [[]], 'ryzova-kasa'),
			recipe(['bezlepkove'], [[]], 'omeleta')
		]);
		expect(result.dietTagSlugs).toEqual([
			{ tag: 'bezlepkove', slugs: ['omeleta', 'ryzova-kasa'] },
			{ tag: 'vegan', slugs: ['ryzova-kasa', 'tofu-kari'] }
		]);
	});

	it('counts a multi-tag recipe under each of its tags', () => {
		const result = computeCorpusAggregates([
			recipe(['vegan', 'bezlepkove', 'bezlaktozove'], [[]], 'salat')
		]);
		expect(result.dietTagSlugs.map((entry) => entry.tag)).toEqual([
			'bezlaktozove',
			'bezlepkove',
			'vegan'
		]);
		for (const entry of result.dietTagSlugs) expect(entry.slugs).toEqual(['salat']);
	});

	it('sorts slugs within a tag so a re-import writes an identical row', () => {
		const result = computeCorpusAggregates([
			recipe(['vegan'], [[]], 'zemiaky'),
			recipe(['vegan'], [[]], 'avokado'),
			recipe(['vegan'], [[]], 'mrkva')
		]);
		expect(result.dietTagSlugs[0].slugs).toEqual(['avokado', 'mrkva', 'zemiaky']);
	});

	it('orders tags with the same Slovak collation as dietTags', () => {
		// The two rows are written separately but must agree on the tag set —
		// the chips come from `dietTags`, the filtered branch from `tagSlugs`,
		// and a tag present in one but not the other yields an empty filter.
		const result = computeCorpusAggregates([
			recipe(['vegetarianske'], [[]], 'a'),
			recipe(['bezlaktozove'], [[]], 'b'),
			recipe(['vegan'], [[]], 'c'),
			recipe(['bezlepkove'], [[]], 'd')
		]);
		expect(result.dietTagSlugs.map((entry) => entry.tag)).toEqual(result.dietTags);
	});

	it('deduplicates a tag repeated on one recipe', () => {
		const result = computeCorpusAggregates([recipe(['vegan', 'vegan'], [[]], 'tofu')]);
		expect(result.dietTagSlugs).toEqual([{ tag: 'vegan', slugs: ['tofu'] }]);
	});

	it('yields no entries when nothing in the corpus is tagged', () => {
		const result = computeCorpusAggregates([recipe([], [[]], 'a'), recipe([], [[]], 'b')]);
		expect(result.dietTagSlugs).toEqual([]);
		expect(result.dietTags).toEqual([]);
	});

	it('stays small because tags are rare — the premise the bounded read rests on', () => {
		// 85% of the real corpus carries no tag at all and the largest tag covers
		// 62 of 635 dishes. If that stopped being true, the filtered branch would
		// no longer be bounded and this aggregate would be the wrong mechanism.
		const corpus = Array.from({ length: 100 }, (_, index) =>
			recipe(index % 10 === 0 ? ['vegan'] : [], [[]], `dish-${String(index).padStart(3, '0')}`)
		);
		const result = computeCorpusAggregates(corpus);
		expect(result.dietTagSlugs).toHaveLength(1);
		expect(result.dietTagSlugs[0].slugs).toHaveLength(10);
	});
});

/**
 * The defining regression test: the aggregates are only safe to precompute if
 * they are byte-identical to what the three full-table-scan queries returned.
 * These are those queries' loops, copied verbatim from the pre-change
 * `convex/pantry.ts` and `convex/recipes.ts`, run over the same fixture.
 */
describe('computeCorpusAggregates matches the queries it replaces', () => {
	function legacyDietTags(recipes: AggregatableRecipe[]): string[] {
		return [...new Set(recipes.flatMap((recipe) => recipe.dietTags))].sort((a, b) =>
			a.localeCompare(b, 'sk')
		);
	}

	function legacyKnownIngredients(recipes: AggregatableRecipe[]): CorpusIngredient[] {
		const known = new Map<string, CorpusIngredient>();
		for (const recipe of recipes) {
			for (const variant of recipe.variants) {
				for (const ingredient of variant.ingredients) {
					if (!known.has(ingredient.nameNorm)) {
						known.set(ingredient.nameNorm, {
							name: ingredient.name,
							nameNorm: ingredient.nameNorm,
							productType: ingredient.productType
						});
					}
				}
			}
		}
		return [...known.values()].sort((a, b) => a.name.localeCompare(b.name, 'sk'));
	}

	function legacyFrequentIngredients(recipes: AggregatableRecipe[]): CorpusIngredient[] {
		const counts = new Map<string, CorpusIngredient & { count: number }>();
		for (const recipe of recipes) {
			const seen = new Set<string>();
			for (const variant of recipe.variants) {
				for (const ingredient of variant.ingredients) {
					if (seen.has(ingredient.nameNorm)) continue;
					seen.add(ingredient.nameNorm);
					const entry = counts.get(ingredient.nameNorm);
					if (entry) {
						entry.count += 1;
					} else {
						counts.set(ingredient.nameNorm, {
							name: ingredient.name,
							nameNorm: ingredient.nameNorm,
							productType: ingredient.productType,
							count: 1
						});
					}
				}
			}
		}
		return [...counts.values()]
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'sk'))
			.slice(0, FREQUENT_LIMIT)
			.map(({ name, nameNorm, productType }) => ({ name, nameNorm, productType }));
	}

	/**
	 * A corpus shaped like the real one: multi-variant dishes with overlapping
	 * ingredients, repeated spellings, a long frequency tail past the cap, and
	 * Slovak diacritics that make the collation matter.
	 */
	const PRODUCT_TYPES = ['zelenina', 'mäso', 'mliečne výrobky', 'korenie', 'prílohy'];
	const NAMES = [
		'cibuľa',
		'Cibuľa',
		'šalát',
		'avokádo',
		'ryža',
		'žemľa',
		'ľadový šalát',
		'čučoriedky',
		'tvaroh',
		'ďumbier',
		'olej',
		'olivový olej',
		'soľ',
		'ocot',
		'zemiaky'
	];
	const TAGS = ['vegan', 'vegetarianske', 'bezlepkove', 'bezlaktozove'];

	const fixture: AggregatableRecipe[] = Array.from({ length: 60 }, (_, index) => {
		const variantCount = (index % 3) + 1;
		return {
			slug: `dish-${String(index).padStart(2, '0')}`,
			// A coprime modulus for the untagged case, so every tag still occurs —
			// `index % TAGS.length` would have masked TAGS[0] entirely.
			dietTags: index % 7 === 0 ? [] : [TAGS[index % TAGS.length]],
			variants: Array.from({ length: variantCount }, (_, variantIndex) => ({
				ingredients: Array.from({ length: (index % 5) + 1 }, (_, n) => {
					const name = NAMES[(index + n * 3 + variantIndex) % NAMES.length];
					return {
						name,
						nameNorm: name.toLowerCase(),
						productType: PRODUCT_TYPES[(index + n) % PRODUCT_TYPES.length]
					};
				})
			}))
		};
	});

	it('produces the legacy output on a corpus-shaped fixture', () => {
		const result = computeCorpusAggregates(fixture);
		expect(result.dietTags).toEqual(legacyDietTags(fixture));
		expect(result.knownIngredients).toEqual(legacyKnownIngredients(fixture));
		expect(result.frequentIngredients).toEqual(legacyFrequentIngredients(fixture));
	});

	it('exercises a fixture that actually stresses the cap and the tie-breaks', () => {
		// Guard the guard: a fixture too small to hit the interesting paths would
		// make the equality assertion above vacuous.
		const result = computeCorpusAggregates(fixture);
		expect(result.knownIngredients.length).toBeGreaterThan(5);
		expect(result.dietTags.length).toBe(TAGS.length);
		// „cibuľa" and „Cibuľa" share a nameNorm — one entry, not two.
		expect(result.knownIngredients.filter((entry) => entry.nameNorm === 'cibuľa')).toHaveLength(1);
		// The two diet-tag rows are written separately; they must describe the
		// same tag set, and every tagged dish must appear under its tag.
		expect(result.dietTagSlugs.map((entry) => entry.tag)).toEqual(result.dietTags);
		expect(result.dietTagSlugs.reduce((total, entry) => total + entry.slugs.length, 0)).toBe(
			fixture.filter((recipe) => recipe.dietTags.length > 0).length
		);
	});
});
