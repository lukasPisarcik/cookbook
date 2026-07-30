import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireToken } from './lib';
import { variant } from './schema';

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
		if (existing) {
			// Preserve user state (isFavorite, cookingToday) and the stored
			// image when the re-run doesn't bring a new one.
			await ctx.db.patch(existing._id, {
				...args.recipe,
				imageId: args.recipe.imageId ?? existing.imageId
			});
			return { action: 'updated', slug: args.recipe.slug };
		}
		await ctx.db.insert('recipes', { ...args.recipe, isFavorite: false });
		return { action: 'inserted', slug: args.recipe.slug };
	}
});

export const upsertPantryItem = mutation({
	args: {
		token: v.string(),
		name: v.string(),
		nameNorm: v.string(),
		productType: v.string()
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const existing = await ctx.db
			.query('pantryItems')
			.withIndex('by_nameNorm', (q) => q.eq('nameNorm', args.nameNorm))
			.unique();
		if (existing) return existing._id;
		return ctx.db.insert('pantryItems', {
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
