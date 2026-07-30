import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireToken } from './lib';
import { normalizeName } from '../src/lib/helpers/normalize';

const FALLBACK_PRODUCT_TYPE = 'ostatné';
/** How many „Časté" tiles the Špajza tab offers. */
const FREQUENT_LIMIT = 40;

export const list = query({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const items = await ctx.db
			.query('pantryItems')
			.withIndex('by_user_nameNorm', (q) => q.eq('userId', args.userId))
			.collect();
		items.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
		return items;
	}
});

/**
 * Distinct ingredient names across all recipes (with their product types) —
 * drives the Špajza autocomplete. Corpus-wide, so no `userId`.
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

/**
 * The ingredients that appear in the most recipes — the „Časté" tiles, so
 * stocking the špajza is a tap rather than typing every word. Corpus-wide;
 * `knownIngredients` stays as the full search corpus.
 */
export const frequentIngredients = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipes = await ctx.db.query('recipes').collect();
		const counts = new Map<
			string,
			{ name: string; nameNorm: string; productType: string; count: number }
		>();
		for (const recipe of recipes) {
			// Count each name once per recipe, not once per variant — the kcal
			// variants of one dish repeat most of the same ingredients.
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
			.slice(0, FREQUENT_LIMIT);
	}
});

export const add = mutation({
	args: {
		token: v.string(),
		userId: v.string(),
		name: v.string(),
		productType: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const name = args.name.trim();
		if (name === '') throw new ConvexError('Pantry item name must not be empty');
		const nameNorm = normalizeName(name);

		// Dedup per user, not globally — two people must both be able to own
		// „cibuľa".
		const existing = await ctx.db
			.query('pantryItems')
			.withIndex('by_user_nameNorm', (q) => q.eq('userId', args.userId).eq('nameNorm', nameNorm))
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
			userId: args.userId,
			name,
			nameNorm,
			productType: productType ?? FALLBACK_PRODUCT_TYPE
		});
	}
});

export const remove = mutation({
	args: { token: v.string(), userId: v.string(), id: v.id('pantryItems') },
	handler: async (ctx, args) => {
		requireToken(args.token);
		// Verify ownership instead of deleting blind — the client sends userId
		// and could name someone else's row.
		const item = await ctx.db.get(args.id);
		if (!item) return;
		if (item.userId !== args.userId) {
			throw new ConvexError('Pantry item belongs to another profile');
		}
		await ctx.db.delete(args.id);
	}
});
