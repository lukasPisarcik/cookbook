import { ConvexError, v } from 'convex/values';
import {
	paginationOptsValidator,
	type PaginationOptions,
	type PaginationResult
} from 'convex/server';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireToken } from './lib';
import { normalizeName } from '../src/lib/helpers/normalize';

/**
 * The recipe corpus is shared and read-only; favourites and „Dnes varím" are
 * per-profile and live in `recipeState`, keyed by (userId, slug).
 */
type RecipeState = Doc<'recipeState'>;

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
 * The slugs this profile has favourited — one indexed read of `recipeState`
 * and no card access at all.
 *
 * This deliberately does not live inside `list`. Convex invalidates a
 * subscription when any table it touched changes, so while `list` also read
 * `recipeState`, toggling a single favourite re-read all 635 card rows (188 KB)
 * to change one boolean. Splitting the two read sets is what makes a toggle
 * cost ~1 KB: nothing a profile writes can invalidate the card read any more.
 */
async function favoriteSlugsFor(ctx: QueryCtx, userId: string): Promise<string[]> {
	const states = await ctx.db
		.query('recipeState')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.collect();
	return states.filter((state) => state.isFavorite).map((state) => state.slug);
}

export const favoriteSlugs = query({
	args: { token: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		requireToken(args.token);
		return favoriteSlugsFor(ctx, args.userId);
	}
});

/**
 * One card row, by slug — the bounded branch's per-slug indexed read, and the
 * cheapest way to answer "does this recipe exist?".
 *
 * `recipeCards` is written in the same transaction as `recipes`, so a card row
 * exists exactly when its recipe does. Checking existence here costs ~330 B
 * against the ~4.2 KB of reading the fat document for the same answer.
 */
async function cardBySlug(
	ctx: QueryCtx | MutationCtx,
	slug: string
): Promise<Doc<'recipeCards'> | null> {
	return ctx.db
		.query('recipeCards')
		.withIndex('by_slug', (q) => q.eq('slug', slug))
		.unique();
}

/**
 * The card the Recepty list renders. Corpus-only — no per-user field — so the
 * subscription depends on `recipeCards` alone. The heart indicator is merged
 * client-side from `favoriteSlugs`.
 */
async function toCard(ctx: QueryCtx, card: Doc<'recipeCards'>) {
	return {
		slug: card.slug,
		title: card.title,
		category: card.category,
		dietTags: card.dietTags,
		prepTimeMinutes: card.prepTimeMinutes,
		kcalOptions: card.kcalOptions,
		imageUrl: card.imageId ? await ctx.storage.getUrl(card.imageId) : null
	};
}

/** Resolve a page of stored rows into the client-facing card shape. */
async function toCardPage(ctx: QueryCtx, result: PaginationResult<Doc<'recipeCards'>>) {
	return { ...result, page: await Promise.all(result.page.map((card) => toCard(ctx, card))) };
}

/**
 * Offsets, not opaque cursors: the bounded slug-list branch below sorts and
 * slices in the handler, so there is no database cursor to hand back. `null`
 * means the start of the results.
 */
function offsetFrom(cursor: string | null | undefined, fallback: number): number {
	if (cursor === null || cursor === undefined || cursor === '') return fallback;
	const parsed = Number(cursor);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Page an in-handler array the way `.paginate()` pages an index.
 *
 * `paginationOptsValidator` accepts any float for `numItems`, and this is a
 * public function reachable with just the token, so the guard is not
 * theoretical: `numItems: 0` would return an empty page whose `continueCursor`
 * equals the cursor it was given, spinning a client's `loadMore`, and a
 * negative value is worse — `slice(0, -5)` counts from the end, so it would
 * return nearly the whole filtered set in one page. `.paginate()` rejects
 * non-positive values on the indexed branches; match it here.
 */
function slicePage<T>(items: T[], opts: PaginationOptions): PaginationResult<T> {
	if (!Number.isFinite(opts.numItems) || opts.numItems < 1) {
		throw new ConvexError(`paginationOpts.numItems must be a positive number: ${opts.numItems}`);
	}
	const start = Math.min(offsetFrom(opts.cursor, 0), items.length);
	// A reactive client pins `endCursor` so a re-executed page covers exactly
	// the range it covered before, leaving no gap between adjacent pages.
	const end =
		opts.endCursor === null || opts.endCursor === undefined
			? Math.min(start + opts.numItems, items.length)
			: Math.min(Math.max(offsetFrom(opts.endCursor, items.length), start), items.length);
	return {
		page: items.slice(start, end),
		isDone: end >= items.length,
		continueCursor: String(end)
	};
}

/**
 * Cards are ordered by `searchText` — the diacritic-stripped lowercase title —
 * which is exactly what `by_searchText` and `by_category_searchText` sort on,
 * so the in-handler branch and the indexed branches agree.
 *
 * Sorting by `title` with Slovak collation cannot work across pages: an index
 * can only give byte order, and on a raw title that puts „Čokoládový" after
 * „Zemiaky". Stripped-diacritic order collapses c and č into one bucket where
 * Slovak collation makes č a distinct letter directly after c —
 * indistinguishable in a recipe list, and strictly closer to correct than the
 * byte order on `title` would be.
 */
function bySearchText(a: Doc<'recipeCards'>, b: Doc<'recipeCards'>): number {
	if (a.searchText < b.searchText) return -1;
	if (a.searchText > b.searchText) return 1;
	return 0;
}

/**
 * A page of the Recepty list. Reads `recipeCards`, never `recipes`, and never
 * `recipeState` unless the favourites toggle is on — see `favoriteSlugsFor`.
 *
 * Four branches, because two of the four filters cannot be indexed and Convex
 * bills documents *read*, not returned: post-filtering a full scan would pay
 * 188 KB to return a handful of rows, which is the exact defect this table was
 * split out to remove.
 */
export const list = query({
	args: {
		token: v.string(),
		paginationOpts: paginationOptsValidator,
		/**
		 * Read only on the favourites branch. `list` is otherwise free of
		 * per-user tables on purpose, so it stays optional rather than becoming
		 * a dependency every branch pays for.
		 */
		userId: v.optional(v.string()),
		search: v.optional(v.string()),
		category: v.optional(v.string()),
		dietTag: v.optional(v.string()),
		favoritesOnly: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		requireToken(args.token);

		const term = args.search && args.search.trim() !== '' ? normalizeName(args.search) : null;

		// --- Bounded slug list: diet tag and/or favourites --------------------
		// `dietTags` is an array field (Convex has no multi-key index) and
		// favourites live in another table, so neither is indexable. Both sets
		// are small and knowable up front — the largest diet tag covers 62 of
		// 635 dishes — so resolve the slugs, read only those cards, then filter,
		// sort and slice in the handler. Worst case 62 indexed reads (~17 KB),
		// with exact page sizes and complete result counts.
		if (args.dietTag || args.favoritesOnly) {
			let slugs: string[] | null = null;

			if (args.dietTag) {
				const row = await ctx.db
					.query('corpusMeta')
					.withIndex('by_kind', (q) => q.eq('kind', 'dietTagSlugs'))
					.unique();
				slugs = row?.tagSlugs?.find((entry) => entry.tag === args.dietTag)?.slugs ?? [];
			}

			if (args.favoritesOnly) {
				// No profile means nothing can be favourited. The client passes
				// 'skip' until one resolves, so this is belt and braces.
				const favorites = args.userId ? await favoriteSlugsFor(ctx, args.userId) : [];
				const favoriteSet = new Set(favorites);
				slugs = slugs === null ? favorites : slugs.filter((slug) => favoriteSet.has(slug));
			}

			const cards = (await Promise.all((slugs ?? []).map((slug) => cardBySlug(ctx, slug)))).filter(
				(card): card is Doc<'recipeCards'> => card !== null
			);

			const matching = cards
				.filter(
					(card) =>
						(!args.category || card.category === args.category) &&
						(!term || card.searchText.includes(term))
				)
				.sort(bySearchText);

			return toCardPage(ctx, slicePage(matching, args.paginationOpts));
		}

		// --- Search: relevance order, category narrowed inside the index -----
		// `category` is a filter field on the search index, so combining the
		// two stays a single indexed read. Post-filtering the page instead
		// would be the documented pagination pitfall: a page of 20 can yield 0
		// matches while more exist, and „load more" appears to do nothing.
		if (term) {
			return toCardPage(
				ctx,
				await ctx.db
					.query('recipeCards')
					.withSearchIndex('search_title', (q) => {
						const scoped = q.search('searchText', term);
						return args.category ? scoped.eq('category', args.category) : scoped;
					})
					.paginate(args.paginationOpts)
			);
		}

		// --- Category, or the whole corpus: alphabetical straight off an index
		if (args.category) {
			return toCardPage(
				ctx,
				await ctx.db
					.query('recipeCards')
					.withIndex('by_category_searchText', (q) => q.eq('category', args.category!))
					.paginate(args.paginationOpts)
			);
		}

		return toCardPage(
			ctx,
			await ctx.db.query('recipeCards').withIndex('by_searchText').paginate(args.paginationOpts)
		);
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
		// Existence only, so read the card row rather than the fat recipe. Reading
		// `recipes` here cost ~4.2 KB and made the mutation the most expensive part
		// of a favourite toggle once the card re-read was gone.
		const card = await cardBySlug(ctx, args.slug);
		if (!card) throw new ConvexError(`Recipe not found: ${args.slug}`);

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
