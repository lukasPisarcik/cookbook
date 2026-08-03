import { ConvexError, v } from 'convex/values';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireToken } from './lib';
import { normalizeName } from '../src/lib/helpers/normalize';

/**
 * The recipe corpus is shared and read-only; favourites and „Dnes varím" are
 * per-profile and live in `recipeState`, keyed by (userId, slug). Every query
 * here reads one user's state in a single indexed read and builds a Map — at a
 * few hundred recipes that is far cheaper than a lookup per recipe.
 */
type RecipeState = Doc<'recipeState'>;

async function stateBySlug(ctx: QueryCtx, userId: string): Promise<Map<string, RecipeState>> {
	const states = await ctx.db
		.query('recipeState')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.collect();
	return new Map(states.map((state) => [state.slug, state]));
}

/** The single (userId, slug) state row, or null when the user has none yet. */
async function stateFor(
	ctx: QueryCtx | MutationCtx,
	userId: string,
	slug: string
): Promise<RecipeState | null> {
	return ctx.db
		.query('recipeState')
		.withIndex('by_user_slug', (q) => q.eq('userId', userId).eq('slug', slug))
		.unique();
}

/**
 * Merge a stored card row with this user's state. The projection itself is
 * precomputed into `recipeCards` by the importer, so listing no longer reads
 * the fat recipe documents at all.
 */
async function toCard(ctx: QueryCtx, card: Doc<'recipeCards'>, states: Map<string, RecipeState>) {
	const state = states.get(card.slug);
	return {
		slug: card.slug,
		title: card.title,
		category: card.category,
		dietTags: card.dietTags,
		prepTimeMinutes: card.prepTimeMinutes,
		kcalOptions: card.kcalOptions,
		isFavorite: state?.isFavorite ?? false,
		cookingToday: state?.cookingToday ?? null,
		imageUrl: card.imageId ? await ctx.storage.getUrl(card.imageId) : null
	};
}

export const list = query({
	args: {
		token: v.string(),
		userId: v.string(),
		search: v.optional(v.string()),
		category: v.optional(v.string()),
		dietTag: v.optional(v.string()),
		favoritesOnly: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		requireToken(args.token);

		// Reads `recipeCards`, never `recipes` — the whole point of the split. The
		// search index lives on the card table too, so no branch here touches a
		// fat document.
		let cards;
		if (args.search && args.search.trim() !== '') {
			cards = await ctx.db
				.query('recipeCards')
				.withSearchIndex('search_title', (q) => q.search('searchText', normalizeName(args.search!)))
				.collect();
		} else if (args.category) {
			cards = await ctx.db
				.query('recipeCards')
				.withIndex('by_category', (q) => q.eq('category', args.category!))
				.collect();
			cards.sort((a, b) => a.title.localeCompare(b.title, 'sk'));
		} else {
			cards = await ctx.db.query('recipeCards').collect();
			cards.sort((a, b) => a.title.localeCompare(b.title, 'sk'));
		}

		const states = await stateBySlug(ctx, args.userId);

		const filtered = cards.filter(
			(card) =>
				(!args.category || card.category === args.category) &&
				(!args.dietTag || card.dietTags.includes(args.dietTag)) &&
				(!args.favoritesOnly || states.get(card.slug)?.isFavorite === true)
		);

		return Promise.all(filtered.map((card) => toCard(ctx, card, states)));
	}
});

export const bySlug = query({
	args: { token: v.string(), userId: v.string(), slug: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipe = await ctx.db
			.query('recipes')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!recipe) return null;
		const state = await stateFor(ctx, args.userId, args.slug);
		return {
			...recipe,
			isFavorite: state?.isFavorite ?? false,
			cookingToday: state?.cookingToday ?? null,
			imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null
		};
	}
});

/** Recipes this profile flagged „Dnes varím", with variant + multiplier. */
export const cookingToday = query({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);

		const flaggedStates = (
			await ctx.db
				.query('recipeState')
				.withIndex('by_user', (q) => q.eq('userId', args.userId))
				.collect()
		).filter((state) => state.cookingToday !== undefined);

		const entries = [];
		for (const state of flaggedStates) {
			const recipe = await ctx.db
				.query('recipes')
				.withIndex('by_slug', (q) => q.eq('slug', state.slug))
				.unique();
			// A flagged recipe can vanish if the corpus is re-imported without it.
			if (!recipe) continue;
			entries.push({
				slug: recipe.slug,
				title: recipe.title,
				variants: recipe.variants.map((variant) => ({
					label: variant.label,
					kcalPerPortion: variant.kcalPerPortion,
					portions: variant.portions
				})),
				cookingToday: state.cookingToday!,
				imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null
			});
		}

		entries.sort((a, b) => a.title.localeCompare(b.title, 'sk'));
		return entries;
	}
});

/**
 * All diet tags in use — drives the filter chips. Corpus-wide, not per user.
 *
 * Four short strings, precomputed by the importer into `corpusMeta`. Deriving
 * them here used to read all 635 recipe documents — 1,357 KB of database I/O to
 * return 53 bytes, which was more than loading the entire shopping and pantry
 * subsystem for both profiles combined.
 */
export const dietTags = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const row = await ctx.db
			.query('corpusMeta')
			.withIndex('by_kind', (q) => q.eq('kind', 'dietTags'))
			.unique();
		return row?.dietTags ?? [];
	}
});

export const toggleFavorite = mutation({
	args: { token: v.string(), userId: v.string(), slug: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const recipe = await ctx.db
			.query('recipes')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!recipe) throw new ConvexError(`Recipe not found: ${args.slug}`);

		const state = await stateFor(ctx, args.userId, args.slug);
		if (!state) {
			await ctx.db.insert('recipeState', {
				userId: args.userId,
				slug: args.slug,
				isFavorite: true
			});
			return true;
		}
		const next = !state.isFavorite;
		await ctx.db.patch(state._id, { isFavorite: next });
		return next;
	}
});

/** Set (or clear, with null) this profile's „Dnes varím" flag. */
export const setCookingToday = mutation({
	args: {
		token: v.string(),
		userId: v.string(),
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

		const state = await stateFor(ctx, args.userId, args.slug);

		if (args.value === null) {
			if (state) await ctx.db.patch(state._id, { cookingToday: undefined });
			return;
		}
		if (recipe.variants.length === 0) {
			throw new ConvexError(`Recipe has no variants: ${args.slug}`);
		}
		const variantIndex = Math.min(Math.max(args.value.variantIndex, 0), recipe.variants.length - 1);
		const portionMultiplier = Math.max(args.value.portionMultiplier, 0.5);
		const cookingToday = { variantIndex, portionMultiplier };

		if (state) {
			await ctx.db.patch(state._id, { cookingToday });
		} else {
			await ctx.db.insert('recipeState', {
				userId: args.userId,
				slug: args.slug,
				isFavorite: false,
				cookingToday
			});
		}
	}
});

/** Clear every „Dnes varím" flag for this profile (the Dnes tab's clear-all). */
export const clearCookingToday = mutation({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		const states = await ctx.db
			.query('recipeState')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.collect();
		await Promise.all(
			states
				.filter((state) => state.cookingToday !== undefined)
				.map((state) => ctx.db.patch(state._id, { cookingToday: undefined }))
		);
	}
});
