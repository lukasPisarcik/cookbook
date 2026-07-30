import { ConvexError, v } from 'convex/values';
import { mutation, query, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireToken } from './lib';
import { normalizeName } from '../src/lib/helpers/normalize';

/** Card projection for the Recepty list. */
async function toCard(ctx: QueryCtx, recipe: Doc<'recipes'>) {
	return {
		slug: recipe.slug,
		title: recipe.title,
		category: recipe.category,
		dietTags: recipe.dietTags,
		prepTimeMinutes: recipe.prepTimeMinutes,
		kcalOptions: recipe.variants
			.map((variant) => variant.kcalPerPortion)
			.filter((kcal): kcal is number => kcal !== undefined),
		isFavorite: recipe.isFavorite,
		cookingToday: recipe.cookingToday ?? null,
		imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null
	};
}

export const list = query({
	args: {
		token: v.string(),
		search: v.optional(v.string()),
		category: v.optional(v.string()),
		dietTag: v.optional(v.string()),
		favoritesOnly: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		requireToken(args.token);

		let recipes;
		if (args.search && args.search.trim() !== '') {
			recipes = await ctx.db
				.query('recipes')
				.withSearchIndex('search_title', (q) => q.search('searchText', normalizeName(args.search!)))
				.collect();
		} else if (args.category) {
			recipes = await ctx.db
				.query('recipes')
				.withIndex('by_category', (q) => q.eq('category', args.category!))
				.collect();
			recipes.sort((a, b) => a.title.localeCompare(b.title, 'sk'));
		} else {
			recipes = await ctx.db.query('recipes').collect();
			recipes.sort((a, b) => a.title.localeCompare(b.title, 'sk'));
		}

		const filtered = recipes.filter(
			(recipe) =>
				(!args.category || recipe.category === args.category) &&
				(!args.dietTag || recipe.dietTags.includes(args.dietTag)) &&
				(!args.favoritesOnly || recipe.isFavorite)
		);

		return Promise.all(filtered.map((recipe) => toCard(ctx, recipe)));
	}
});

export const bySlug = query({
	args: { token: v.string(), slug: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipe = await ctx.db
			.query('recipes')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!recipe) return null;
		return {
			...recipe,
			imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null
		};
	}
});

/** Recipes flagged „Dnes varím", with their chosen variant + multiplier. */
export const cookingToday = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipes = await ctx.db.query('recipes').collect();
		const flagged = recipes.filter((recipe) => recipe.cookingToday !== undefined);
		flagged.sort((a, b) => a.title.localeCompare(b.title, 'sk'));
		return Promise.all(
			flagged.map(async (recipe) => ({
				slug: recipe.slug,
				title: recipe.title,
				variants: recipe.variants.map((variant) => ({
					label: variant.label,
					kcalPerPortion: variant.kcalPerPortion,
					portions: variant.portions
				})),
				cookingToday: recipe.cookingToday!,
				imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null
			}))
		);
	}
});

/** All diet tags in use — drives the filter chips. */
export const dietTags = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipes = await ctx.db.query('recipes').collect();
		return [...new Set(recipes.flatMap((recipe) => recipe.dietTags))].sort((a, b) =>
			a.localeCompare(b, 'sk')
		);
	}
});

export const toggleFavorite = mutation({
	args: { token: v.string(), slug: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipe = await ctx.db
			.query('recipes')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!recipe) throw new ConvexError(`Recipe not found: ${args.slug}`);
		await ctx.db.patch(recipe._id, { isFavorite: !recipe.isFavorite });
		return !recipe.isFavorite;
	}
});

/** Set (or clear, with null) the „Dnes varím" flag with variant + multiplier. */
export const setCookingToday = mutation({
	args: {
		token: v.string(),
		slug: v.string(),
		value: v.union(
			v.null(),
			v.object({
				variantIndex: v.number(),
				portionMultiplier: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipe = await ctx.db
			.query('recipes')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!recipe) throw new ConvexError(`Recipe not found: ${args.slug}`);
		if (args.value === null) {
			await ctx.db.patch(recipe._id, { cookingToday: undefined });
			return;
		}
		if (recipe.variants.length === 0) {
			throw new ConvexError(`Recipe has no variants: ${args.slug}`);
		}
		const variantIndex = Math.min(Math.max(args.value.variantIndex, 0), recipe.variants.length - 1);
		const portionMultiplier = Math.max(args.value.portionMultiplier, 0.5);
		await ctx.db.patch(recipe._id, { cookingToday: { variantIndex, portionMultiplier } });
	}
});

/** Clear every „Dnes varím" flag (the Dnes tab's clear-all action). */
export const clearCookingToday = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipes = await ctx.db.query('recipes').collect();
		await Promise.all(
			recipes
				.filter((recipe) => recipe.cookingToday !== undefined)
				.map((recipe) => ctx.db.patch(recipe._id, { cookingToday: undefined }))
		);
	}
});
