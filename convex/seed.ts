import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireToken } from './lib';
import { corpusIngredient, variant } from './schema';

/**
 * Seed-import surface, used only by `tools/seed/import.ts`.
 *
 * These are public (so the import script can call them over the normal
 * client) but token-guarded like every other function; the import is
 * idempotent — recipes upsert by slug, pantry items by normalized name,
 * and user state (favorites, cooking flags, checked items) is preserved.
 */

export const generateUploadUrl = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		return ctx.storage.generateUploadUrl();
	}
});

export const upsertRecipe = mutation({
	args: {
		token: v.string(),
		recipe: v.object({
			slug: v.string(),
			title: v.string(),
			searchText: v.string(),
			category: v.string(),
			dietTags: v.array(v.string()),
			prepTimeMinutes: v.optional(v.number()),
			steps: v.array(v.string()),
			funFact: v.optional(v.string()),
			variants: v.array(variant),
			imageId: v.optional(v.id('_storage')),
			source: v.string(),
			sourceRef: v.optional(v.string())
		})
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const existing = await ctx.db
			.query('recipes')
			.withIndex('by_slug', (q) => q.eq('slug', args.recipe.slug))
			.unique();

		// Keep the stored image when the re-run doesn't bring a new one.
		const imageId = args.recipe.imageId ?? existing?.imageId;

		if (existing) {
			// Per-user state lives in `recipeState`, keyed by slug, so replacing
			// the recipe document never touches it.
			await ctx.db.patch(existing._id, { ...args.recipe, imageId });
		} else {
			await ctx.db.insert('recipes', { ...args.recipe, imageId });
		}

		// The card row is written in this same mutation — a Convex mutation is
		// transactional, so `recipes` and `recipeCards` cannot drift. Do not add a
		// second entry point that writes only one of them.
		const card = {
			slug: args.recipe.slug,
			title: args.recipe.title,
			searchText: args.recipe.searchText,
			category: args.recipe.category,
			dietTags: args.recipe.dietTags,
			prepTimeMinutes: args.recipe.prepTimeMinutes,
			kcalOptions: args.recipe.variants
				.map((variant) => variant.kcalPerPortion)
				.filter((kcal): kcal is number => kcal !== undefined),
			imageId
		};
		const existingCard = await ctx.db
			.query('recipeCards')
			.withIndex('by_slug', (q) => q.eq('slug', args.recipe.slug))
			.unique();
		if (existingCard) await ctx.db.patch(existingCard._id, card);
		else await ctx.db.insert('recipeCards', card);

		return { action: existing ? 'updated' : 'inserted', slug: args.recipe.slug };
	}
});

/**
 * Delete every recipe outside `keepSlugs` — the write half of the importer's
 * `--limit N --prune`.
 *
 * The importer upserts by slug and never deletes, so `--limit` alone saves
 * nothing on a deployment that already holds the full corpus: the other ~595
 * recipes simply stay. This is the dev-only escape hatch, and the one function
 * besides `importStats` that legitimately scans the whole table — it runs at
 * import time, not on the hot read path.
 *
 * Per-user `recipeState` rows are deliberately left alone: they are keyed by
 * slug, cost nothing when orphaned (`recipes.cookingToday` already skips slugs
 * with no recipe), and survive to be picked up again by a later full import.
 */
export const pruneRecipes = mutation({
	args: { token: v.string(), keepSlugs: v.array(v.string()) },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const keep = new Set(args.keepSlugs);

		const recipes = await ctx.db.query('recipes').collect();
		let deletedRecipes = 0;
		for (const recipe of recipes) {
			if (keep.has(recipe.slug)) continue;
			await ctx.db.delete(recipe._id);
			deletedRecipes += 1;
		}

		const cards = await ctx.db.query('recipeCards').collect();
		let deletedCards = 0;
		for (const card of cards) {
			if (keep.has(card.slug)) continue;
			await ctx.db.delete(card._id);
			deletedCards += 1;
		}

		return { deletedRecipes, deletedCards };
	}
});

/**
 * Replace the three precomputed corpus aggregates.
 *
 * The importer computes these (it already holds every merged recipe in memory,
 * so it costs no database I/O) and pushes them here in one mutation, so the
 * three rows can never disagree about which corpus they describe. Corpus data
 * is shared, so there is no `userId` — but the token guard still applies.
 */
export const upsertCorpusMeta = mutation({
	args: {
		token: v.string(),
		recipeCount: v.number(),
		dietTags: v.array(v.string()),
		knownIngredients: v.array(corpusIngredient),
		frequentIngredients: v.array(corpusIngredient)
	},
	handler: async (ctx, args) => {
		requireToken(args.token);

		const rows = [
			{ kind: 'dietTags' as const, dietTags: args.dietTags },
			{ kind: 'knownIngredients' as const, ingredients: args.knownIngredients },
			{ kind: 'frequentIngredients' as const, ingredients: args.frequentIngredients }
		];

		for (const row of rows) {
			const existing = await ctx.db
				.query('corpusMeta')
				.withIndex('by_kind', (q) => q.eq('kind', row.kind))
				.unique();
			// Replace rather than patch: `dietTags` and `ingredients` are mutually
			// exclusive per kind, and patching would leave the other one behind.
			if (existing) await ctx.db.delete(existing._id);
			await ctx.db.insert('corpusMeta', { ...row, recipeCount: args.recipeCount });
		}

		return { recipeCount: args.recipeCount };
	}
});

export const upsertPantryItem = mutation({
	args: {
		token: v.string(),
		/** Which profile's špajza the starter pantry lands in. */
		userId: v.string(),
		name: v.string(),
		nameNorm: v.string(),
		productType: v.string()
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const existing = await ctx.db
			.query('pantryItems')
			.withIndex('by_user_nameNorm', (q) =>
				q.eq('userId', args.userId).eq('nameNorm', args.nameNorm)
			)
			.unique();
		if (existing) return existing._id;
		return ctx.db.insert('pantryItems', {
			userId: args.userId,
			name: args.name,
			nameNorm: args.nameNorm,
			productType: args.productType
		});
	}
});

/** Lightweight projection for import verification (counts, anomaly report). */
export const importStats = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipes = await ctx.db.query('recipes').collect();
		return recipes.map((recipe) => ({
			slug: recipe.slug,
			title: recipe.title,
			source: recipe.source,
			sourceRef: recipe.sourceRef,
			category: recipe.category,
			variantCount: recipe.variants.length,
			hasImage: recipe.imageId !== undefined,
			hasMacros: recipe.variants.some((v) => v.macros !== undefined),
			kcals: recipe.variants
				.map((v) => v.kcalPerPortion)
				.filter((kcal): kcal is number => kcal !== undefined)
		}));
	}
});
