import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireToken } from './lib';
import { aggregateShoppingList, type FlaggedRecipe } from '../src/lib/helpers/shopping';

export const list = query({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const items = await ctx.db
			.query('shoppingItems')
			.withIndex('by_user_productType', (q) => q.eq('userId', args.userId))
			.collect();
		items.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
		return items;
	}
});

/**
 * (Re)build this profile's shopping list from the recipes it flagged
 * „Dnes varím": chosen variant's ingredients × portion multiplier, summed per
 * (normalized name, unit), grouped by product type, pantry items marked
 * excluded. Rows whose (nameNorm, unit) already exist KEEP their
 * checked/overridden state; rows no longer needed are deleted.
 *
 * Every read AND the closing delete sweep are scoped to `userId`. An unscoped
 * sweep would silently erase the other profile's entire list.
 */
export const regenerate = mutation({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);

		const states = (
			await ctx.db
				.query('recipeState')
				.withIndex('by_user', (q) => q.eq('userId', args.userId))
				.collect()
		).filter((state) => state.cookingToday !== undefined);

		const flagged: FlaggedRecipe[] = [];
		for (const state of states) {
			const recipe = await ctx.db
				.query('recipes')
				.withIndex('by_slug', (q) => q.eq('slug', state.slug))
				.unique();
			if (!recipe || recipe.variants.length === 0) continue;
			const { variantIndex, portionMultiplier } = state.cookingToday!;
			const variant =
				recipe.variants[Math.min(Math.max(variantIndex, 0), recipe.variants.length - 1)];
			flagged.push({
				slug: recipe.slug,
				portionMultiplier,
				ingredients: variant.ingredients
			});
		}

		const pantry = await ctx.db
			.query('pantryItems')
			.withIndex('by_user_nameNorm', (q) => q.eq('userId', args.userId))
			.collect();
		const aggregated = aggregateShoppingList(
			flagged,
			pantry.map((item) => item.nameNorm)
		);

		const existing = await ctx.db
			.query('shoppingItems')
			.withIndex('by_user_productType', (q) => q.eq('userId', args.userId))
			.collect();
		const existingByKey = new Map(
			existing.map((item) => [`${item.nameNorm}|${item.unit ?? ''}`, item])
		);
		const neededKeys = new Set<string>();

		for (const item of aggregated) {
			const key = `${item.nameNorm}|${item.unit ?? ''}`;
			neededKeys.add(key);
			const current = existingByKey.get(key);
			if (current) {
				await ctx.db.patch(current._id, {
					name: item.name,
					quantity: item.quantity,
					productType: item.productType,
					recipeSlugs: item.recipeSlugs,
					excludedByPantry: item.excludedByPantry
					// checked/overridden deliberately preserved
				});
			} else {
				await ctx.db.insert('shoppingItems', {
					...item,
					userId: args.userId,
					checked: false,
					overridden: false
				});
			}
		}

		// `existing` is already user-scoped, so this sweep cannot touch another
		// profile's rows.
		for (const item of existing) {
			if (!neededKeys.has(`${item.nameNorm}|${item.unit ?? ''}`)) {
				await ctx.db.delete(item._id);
			}
		}

		return { itemCount: aggregated.length, recipeCount: flagged.length };
	}
});

export const setChecked = mutation({
	args: {
		token: v.string(),
		userId: v.string(),
		id: v.id('shoppingItems'),
		checked: v.boolean()
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const item = await ctx.db.get(args.id);
		if (!item) return;
		if (item.userId !== args.userId) {
			throw new ConvexError('Shopping item belongs to another profile');
		}
		await ctx.db.patch(args.id, { checked: args.checked });
	}
});

/** „Kúpim aj tak" — move a pantry-excluded item back onto the list (or undo). */
export const setOverridden = mutation({
	args: {
		token: v.string(),
		userId: v.string(),
		id: v.id('shoppingItems'),
		overridden: v.boolean()
	},
	handler: async (ctx, args) => {
		requireToken(args.token);
		const item = await ctx.db.get(args.id);
		if (!item) return;
		if (item.userId !== args.userId) {
			throw new ConvexError('Shopping item belongs to another profile');
		}
		await ctx.db.patch(args.id, { overridden: args.overridden });
	}
});
