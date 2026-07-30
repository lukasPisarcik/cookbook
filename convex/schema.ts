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
		sourceRef: v.optional(v.string()),
		isFavorite: v.boolean(),
		cookingToday: v.optional(
			v.object({
				variantIndex: v.number(),
				portionMultiplier: v.number()
			})
		)
	})
		.index('by_slug', ['slug'])
		.index('by_category', ['category'])
		.searchIndex('search_title', { searchField: 'searchText' }),

	pantryItems: defineTable({
		nameNorm: v.string(),
		name: v.string(),
		productType: v.string()
	}).index('by_nameNorm', ['nameNorm']),

	shoppingItems: defineTable({
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
	}).index('by_productType', ['productType'])
});
