/**
 * Pure corpus aggregation — the four static answers the app derives from the
 * whole recipe corpus: the diet tags in use, which slugs carry each of them,
 * every distinct ingredient, and the most frequently used ones.
 *
 * These used to be computed inside `pantry.knownIngredients`,
 * `pantry.frequentIngredients` and `recipes.dietTags`, each of which read all
 * 635 recipe documents (1,357 KB) on every single call to return at most 116
 * KB — and 53 bytes in the diet-tag case. Convex bills whole documents, so
 * that was 71% of the monthly database-I/O allowance spent on data that only
 * changes when the importer runs.
 *
 * The loops below are lifted verbatim from those queries so the precomputed
 * rows are provably identical to what the queries returned. The importer calls
 * this once (it already holds every merged recipe in memory, so it costs zero
 * database I/O) and pushes the result to `corpusMeta`; the queries became
 * single-row indexed reads. Same reuse pattern as `aggregateShoppingList`.
 */

/** How many „Časté" tiles the Špajza tab offers. */
export const FREQUENT_LIMIT = 40;

/** An ingredient reference as the aggregates carry it — no quantity or unit. */
export interface CorpusIngredient {
	name: string;
	nameNorm: string;
	productType: string;
}

/**
 * The slice of a recipe the aggregates need. Structurally satisfied by both a
 * `Doc<'recipes'>` and the importer's merged dish, so neither side needs a cast.
 */
export interface AggregatableRecipe {
	slug: string;
	dietTags: string[];
	variants: { ingredients: CorpusIngredient[] }[];
}

/**
 * A diet tag and every slug carrying it.
 *
 * This exists because `dietTags` is an array field and Convex has no multi-key
 * index, so filtering the card table by tag meant scanning all 635 rows (188
 * KB) to return at most 62. Diet tags are rare enough — 85% of the corpus
 * carries none, and the largest tag covers 62 dishes — that precomputing the
 * whole tag → slugs mapping costs ~3.2 KB for all four tags and turns the
 * filtered branch into a bounded set of indexed reads.
 */
export interface DietTagSlugs {
	tag: string;
	slugs: string[];
}

export interface CorpusAggregates {
	/** Corpus size these aggregates were computed from — a staleness probe. */
	recipeCount: number;
	dietTags: string[];
	dietTagSlugs: DietTagSlugs[];
	knownIngredients: CorpusIngredient[];
	frequentIngredients: CorpusIngredient[];
}

/**
 * Compute all four aggregates in one pass over the corpus.
 *
 * Where an ingredient's `nameNorm` appears with several spellings, the first
 * occurrence wins its display `name` and `productType` — matching the previous
 * query behaviour. "First" follows the caller's iteration order, which for a
 * fresh import is also the order the documents are inserted in, so the
 * importer and the old full-table scan agree.
 */
export function computeCorpusAggregates(recipes: AggregatableRecipe[]): CorpusAggregates {
	const dietTags = new Set<string>();
	const tagSlugs = new Map<string, Set<string>>();
	const known = new Map<string, CorpusIngredient>();
	const counts = new Map<string, { ingredient: CorpusIngredient; count: number }>();

	for (const recipe of recipes) {
		for (const tag of recipe.dietTags) {
			dietTags.add(tag);
			// A Set per tag, so a recipe listing the same tag twice — or two
			// recipes sharing a slug — cannot inflate the list.
			const slugs = tagSlugs.get(tag);
			if (slugs) slugs.add(recipe.slug);
			else tagSlugs.set(tag, new Set([recipe.slug]));
		}

		// Count each name once per recipe, not once per variant — the kcal
		// variants of one dish repeat most of the same ingredients.
		const seen = new Set<string>();
		for (const variant of recipe.variants) {
			for (const ingredient of variant.ingredients) {
				const entry: CorpusIngredient = {
					name: ingredient.name,
					nameNorm: ingredient.nameNorm,
					productType: ingredient.productType
				};
				if (!known.has(ingredient.nameNorm)) known.set(ingredient.nameNorm, entry);

				if (seen.has(ingredient.nameNorm)) continue;
				seen.add(ingredient.nameNorm);
				const counted = counts.get(ingredient.nameNorm);
				if (counted) {
					counted.count += 1;
				} else {
					counts.set(ingredient.nameNorm, { ingredient: entry, count: 1 });
				}
			}
		}
	}

	return {
		recipeCount: recipes.length,
		dietTags: [...dietTags].sort((a, b) => a.localeCompare(b, 'sk')),
		// Same tag order as `dietTags` above; slugs sorted so a re-import writes
		// an identical row and the filtered branch reads a stable order.
		dietTagSlugs: [...tagSlugs.entries()]
			.sort(([a], [b]) => a.localeCompare(b, 'sk'))
			.map(([tag, slugs]) => ({ tag, slugs: [...slugs].sort() })),
		knownIngredients: [...known.values()].sort((a, b) => a.name.localeCompare(b.name, 'sk')),
		frequentIngredients: [...counts.values()]
			.sort((a, b) => b.count - a.count || a.ingredient.name.localeCompare(b.ingredient.name, 'sk'))
			.slice(0, FREQUENT_LIMIT)
			.map((counted) => counted.ingredient)
	};
}
