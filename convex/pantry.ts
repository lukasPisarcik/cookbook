import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireToken } from './lib';
import { normalizeName } from '../src/lib/helpers/normalize';

const FALLBACK_PRODUCT_TYPE = 'ostatné';

export const list = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const items = await ctx.db.query('pantryItems').collect();
		items.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
		return items;
	}
});

/**
 * Distinct ingredient names across all recipes (with their product types) —
 * drives the Špajza autocomplete.
 */
export const knownIngredients = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipes = await ctx.db.query('recipes').collect();
		const known = new Map<string, { name: string; nameNorm: string; productType: string }>();
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
});

export const add = mutation({
	args: {
		token: v.string(),
		name: v.string(),
		productType: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const name = args.name.trim();
		if (name === '') throw new ConvexError('Pantry item name must not be empty');
		const nameNorm = normalizeName(name);

		const existing = await ctx.db
			.query('pantryItems')
			.withIndex('by_nameNorm', (q) => q.eq('nameNorm', nameNorm))
			.unique();
		if (existing) return existing._id;

		let productType = args.productType;
		if (!productType) {
			const recipes = await ctx.db.query('recipes').collect();
			outer: for (const recipe of recipes) {
				for (const variant of recipe.variants) {
					for (const ingredient of variant.ingredients) {
						if (ingredient.nameNorm === nameNorm) {
							productType = ingredient.productType;
							break outer;
						}
					}
				}
			}
		}

		return ctx.db.insert('pantryItems', {
			name,
			nameNorm,
			productType: productType ?? FALLBACK_PRODUCT_TYPE
		});
	}
});

export const remove = mutation({
	args: { token: v.string(), id: v.id('pantryItems') },
	handler: async (ctx, args) => {
		requireToken(args.token);
		await ctx.db.delete(args.id);
	}
});
