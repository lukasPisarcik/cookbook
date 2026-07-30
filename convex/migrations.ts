import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

/**
 * One-shot migration from the single-tenant model to per-profile state.
 *
 * Run it by hand, once per deployment that holds pre-migration data, between
 * schema phase 1 (widen — every new field optional) and schema phase 3
 * (tighten — `userId` required, the legacy recipe fields deleted):
 *
 *   bunx convex run migrations:adoptLegacyState '{"userId":"lukas"}'
 *
 * Order matters: copy before stripping. Every branch is a no-op once it has
 * run, so re-running is safe — a row that no longer carries the legacy fields
 * is skipped entirely, and an existing `recipeState` row is never overwritten.
 * On a *fresh* deployment there is nothing to adopt and it returns all zeros.
 *
 * Deliberately not wired into a build step: a data-destructive mutation should
 * not run on every deploy.
 */

/**
 * `recipes.isFavorite` / `recipes.cookingToday` are gone from `schema.ts` (that
 * is the point of the migration), so the generated `Doc<'recipes'>` no longer
 * declares them. This is the shape those rows had *before* the migration; the
 * casts below are confined to this file.
 */
interface LegacyRecipeFields {
	isFavorite?: boolean;
	cookingToday?: { variantIndex: number; portionMultiplier: number };
}

export const adoptLegacyState = internalMutation({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		let stateInserted = 0;
		let recipesStripped = 0;
		let pantryStamped = 0;
		let shoppingStamped = 0;

		for (const recipe of await ctx.db.query('recipes').collect()) {
			const legacy = recipe as typeof recipe & LegacyRecipeFields;
			const legacyFavorite = legacy.isFavorite;
			const legacyCooking = legacy.cookingToday;

			// Already migrated — both legacy fields are gone from this row.
			if (legacyFavorite === undefined && legacyCooking === undefined) continue;

			// Only carry over state worth keeping: an unfavourited, unflagged
			// recipe needs no row at all.
			if (legacyFavorite === true || legacyCooking !== undefined) {
				const existing = await ctx.db
					.query('recipeState')
					.withIndex('by_user_slug', (q) => q.eq('userId', args.userId).eq('slug', recipe.slug))
					.unique();
				if (!existing) {
					await ctx.db.insert('recipeState', {
						userId: args.userId,
						slug: recipe.slug,
						isFavorite: legacyFavorite === true,
						cookingToday: legacyCooking
					});
					stateInserted += 1;
				}
			}

			// Strip the legacy fields so schema phase 3 can drop them.
			await ctx.db.patch(recipe._id, {
				isFavorite: undefined,
				cookingToday: undefined
			} as Partial<typeof recipe> & LegacyRecipeFields);
			recipesStripped += 1;
		}

		for (const item of await ctx.db.query('pantryItems').collect()) {
			// `userId` is required post-phase-3, so a pre-migration row reads as
			// undefined at runtime even though the type says otherwise.
			if ((item.userId as string | undefined) === undefined) {
				await ctx.db.patch(item._id, { userId: args.userId });
				pantryStamped += 1;
			}
		}

		for (const item of await ctx.db.query('shoppingItems').collect()) {
			if ((item.userId as string | undefined) === undefined) {
				await ctx.db.patch(item._id, { userId: args.userId });
				shoppingStamped += 1;
			}
		}

		return { stateInserted, recipesStripped, pantryStamped, shoppingStamped };
	}
});
