import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const ingredient = v.object({
	/** Display name, e.g. "jazmínová ryža". */
	name: v.string(),
	/** Normalized: lowercase, diacritics stripped — matching key. */
	nameNorm: v.string(),
	quantity: v.optional(v.number()),
	/** g | ml | ks | konzerva | … */
	unit: v.optional(v.string()),
	/** Druh produktu — grouping key for the Nákup tab. */
	productType: v.string()
});

/**
 * An ingredient as the precomputed corpus aggregates carry it — identity and
 * grouping only, no quantity or unit (those are per-recipe, not per-corpus).
 */
export const corpusIngredient = v.object({
	name: v.string(),
	nameNorm: v.string(),
	productType: v.string()
});

/**
 * A diet tag and every slug carrying it. `recipeCards.dietTags` is an array and
 * Convex has no multi-key index, so this precomputed mapping is what lets the
 * diet chips resolve a bounded slug list instead of scanning the card table.
 */
export const dietTagSlugs = v.object({
	tag: v.string(),
	slugs: v.array(v.string())
});

export const variant = v.object({
	/** "400 kcal" | "500 kcal" | "600 kcal" | "štandard". */
	label: v.string(),
	kcalPerPortion: v.optional(v.number()),
	portions: v.optional(v.number()),
	macros: v.optional(
		v.object({
			carbs: v.number(),
			protein: v.number(),
			fat: v.number()
		})
	),
	ingredients: v.array(ingredient)
});

export default defineSchema({
	recipes: defineTable({
		slug: v.string(),
		title: v.string(),
		/** Normalized title for diacritic-insensitive search. */
		searchText: v.string(),
		/** ranajky | obedy | vecere | snacky | smoothies | drinky | dezerty | zaklady. */
		category: v.string(),
		/** bezlepkove | bezlaktozove | vegan | … */
		dietTags: v.array(v.string()),
		prepTimeMinutes: v.optional(v.number()),
		steps: v.array(v.string()),
		funFact: v.optional(v.string()),
		variants: v.array(variant),
		imageId: v.optional(v.id('_storage')),
		/** Source document filename. */
		source: v.string(),
		/** Page / blueprint code (R1…) inside the source. */
		sourceRef: v.optional(v.string())
		// `isFavorite` and `cookingToday` used to live here, shared by everyone
		// with the password. They are now per-user in `recipeState`; the
		// `migrations:adoptLegacyState` mutation copied them across and stripped
		// them from every row before this field list dropped them.
	})
		// Only `by_slug` remains: the detail page is the sole reader of the fat
		// documents. Listing, filtering by category and searching all moved to
		// `recipeCards`, so the category and search indexes are not paid for twice.
		.index('by_slug', ['slug']),

	/**
	 * The thin card projection the Recepty list renders — a derived subset of
	 * `recipes`, written in the same transaction by `seed.upsertRecipe`.
	 *
	 * The list only ever needed these nine fields (~230 B per recipe), but
	 * Convex bills whole documents, so reading them off `recipes` paid for every
	 * recipe's steps, variants and ingredient rows too — a 9.6× overcharge, and
	 * one that a single favourite toggle re-paid in full, because Convex
	 * invalidates a subscription when any table it touched changes.
	 *
	 * `recipes` keeps `by_slug` for the detail page; the search index lives here
	 * now, so searching never touches the fat table either.
	 */
	recipeCards: defineTable({
		slug: v.string(),
		title: v.string(),
		/** Normalized title for diacritic-insensitive search. */
		searchText: v.string(),
		category: v.string(),
		dietTags: v.array(v.string()),
		prepTimeMinutes: v.optional(v.number()),
		kcalOptions: v.array(v.number()),
		imageId: v.optional(v.id('_storage'))
	})
		.index('by_slug', ['slug'])
		// Ordered by `searchText`, the diacritic-stripped lowercase title, so a
		// paginated read comes back in diacritic-insensitive alphabetical order
		// without collecting the table first. An index on `title` could only give
		// UTF-8 byte order, which would sort „Čokoládový" after „Zemiaky".
		// `by_category_searchText` supersedes the old `by_category`: it serves the
		// same equality lookup and adds the ordering the page needs.
		.index('by_searchText', ['searchText'])
		.index('by_category_searchText', ['category', 'searchText'])
		// `category` is a filter field so a search can be narrowed to one
		// category inside the index. Post-filtering a search page instead would
		// be the documented pagination pitfall — a page of 20 can yield 0 matches
		// while more exist, making „load more" look broken.
		.searchIndex('search_title', { searchField: 'searchText', filterFields: ['category'] }),

	/**
	 * Importer-computed aggregates over the whole corpus — the diet tags in
	 * use, every distinct ingredient, and the most frequent ones.
	 *
	 * These are derived data, not a source of truth: they exist because
	 * deriving them at read time meant re-reading all 635 recipe documents
	 * (1,357 KB) on every call to return at most 116 KB. Convex bills whole
	 * documents, so that alone was 71% of the monthly database-I/O allowance.
	 * One row per aggregate kind, so each query reads only its own payload.
	 * Shared corpus data — no `userId` (rule 7 does not apply).
	 */
	corpusMeta: defineTable({
		kind: v.union(
			v.literal('dietTags'),
			v.literal('knownIngredients'),
			v.literal('frequentIngredients'),
			v.literal('dietTagSlugs')
		),
		/** Corpus size when this row was written — a mismatch means it is stale. */
		recipeCount: v.number(),
		/**
		 * Set on the `dietTags` row only — just the four names.
		 *
		 * Kept separate from `tagSlugs` rather than derived from it: the chips
		 * need only the names and are read on every home mount, while the slug
		 * lists are read only when a chip is actually active. Merging the two
		 * would put 3.2 KB on the common path to save one row.
		 */
		dietTags: v.optional(v.array(v.string())),
		/** Set on the `dietTagSlugs` row only — tag → the slugs carrying it. */
		tagSlugs: v.optional(v.array(dietTagSlugs)),
		/** Set on the `knownIngredients` / `frequentIngredients` rows only. */
		ingredients: v.optional(v.array(corpusIngredient))
	}).index('by_kind', ['kind']),

	/**
	 * Per-user recipe state — favourites and „Dnes varím". Keyed by `slug`
	 * rather than by document id so the importer can keep replacing recipe
	 * documents without touching anyone's state.
	 */
	recipeState: defineTable({
		userId: v.string(),
		slug: v.string(),
		isFavorite: v.boolean(),
		cookingToday: v.optional(
			v.object({
				variantIndex: v.number(),
				portionMultiplier: v.number()
			})
		)
	})
		.index('by_user', ['userId'])
		.index('by_user_slug', ['userId', 'slug']),

	pantryItems: defineTable({
		userId: v.string(),
		nameNorm: v.string(),
		name: v.string(),
		productType: v.string()
	}).index('by_user_nameNorm', ['userId', 'nameNorm']),

	shoppingItems: defineTable({
		userId: v.string(),
		nameNorm: v.string(),
		name: v.string(),
		quantity: v.optional(v.number()),
		unit: v.optional(v.string()),
		productType: v.string(),
		/** Provenance — which flagged recipes need it. */
		recipeSlugs: v.array(v.string()),
		checked: v.boolean(),
		excludedByPantry: v.boolean(),
		/** „Kúpim aj tak" — buy despite the pantry having it. */
		overridden: v.boolean()
	}).index('by_user_productType', ['userId', 'productType'])
});
