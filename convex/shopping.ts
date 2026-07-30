import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireToken } from './lib';
import { aggregateShoppingList, type FlaggedRecipe } from '../src/lib/helpers/shopping';

export const list = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const items = await ctx.db.query('shoppingItems').collect();
		items.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
		return items;
	}
});

/**
 * (Re)build the shopping list from the recipes flagged „Dnes varím":
 * chosen variant's ingredients × portion multiplier, summed per
 * (normalized name, unit), grouped by product type, pantry items marked
 * excluded. Rows whose (nameNorm, unit) already exist KEEP their
 * checked/overridden state; rows no longer needed are deleted.
 */
export const regenerate = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);

		const recipes = await ctx.db.query('recipes').collect();
		const flagged: FlaggedRecipe[] = recipes
			.filter((recipe) => recipe.cookingToday !== undefined && recipe.variants.length > 0)
			.map((recipe) => {
				const { variantIndex, portionMultiplier } = recipe.cookingToday!;
				const variant =
					recipe.variants[Math.min(Math.max(variantIndex, 0), recipe.variants.length - 1)];
				return {
					slug: recipe.slug,
					portionMultiplier,
					ingredients: variant.ingredients
				};
			});

		const pantry = await ctx.db.query('pantryItems').collect();
		const aggregated = aggregateShoppingList(
			flagged,
			pantry.map((item) => item.nameNorm)
		);

		const existing = await ctx.db.query('shoppingItems').collect();
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
					checked: false,
					overridden: false
				});
			}
		}

		for (const item of existing) {
			if (!neededKeys.has(`${item.nameNorm}|${item.unit ?? ''}`)) {
				await ctx.db.delete(item._id);
			}
		}

		return { itemCount: aggregated.length, recipeCount: flagged.length };
	}
});

export const setChecked = mutation({
	args: { token: v.string(), id: v.id('shoppingItems'), checked: v.boolean() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		await ctx.db.patch(args.id, { checked: args.checked });
	}
});

/** „Kúpim aj tak" — move a pantry-excluded item back onto the list (or undo). */
export const setOverridden = mutation({
	args: { token: v.string(), id: v.id('shoppingItems'), overridden: v.boolean() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		await ctx.db.patch(args.id, { overridden: args.overridden });
	}
});
