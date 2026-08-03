import { ConvexError, v } from 'convex/values';
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server';
import { requireToken } from './lib';
import { normalizeName } from '../src/lib/helpers/normalize';
import type { CorpusIngredient } from '../src/lib/helpers/corpus';

const FALLBACK_PRODUCT_TYPE = 'ostatné';

/**
 * Read one precomputed aggregate row.
 *
 * These used to be derived here with `ctx.db.query('recipes').collect()`, which
 * re-read all 635 recipe documents (1,357 KB) per call to return at most 116 KB
 * — 71% of the monthly database-I/O allowance between them. The importer now
 * precomputes them into `corpusMeta`; see `src/lib/helpers/corpus.ts`.
 *
 * An empty array means the row is missing, which happens only if the schema was
 * pushed without a subsequent import. It fails soft — no autocomplete and no
 * „Časté" tiles rather than an error — so re-run `bun tools/seed/import.ts`.
 */
async function corpusIngredients(
	ctx: QueryCtx | MutationCtx,
	kind: 'knownIngredients' | 'frequentIngredients'
): Promise<CorpusIngredient[]> {
	const row = await ctx.db
		.query('corpusMeta')
		.withIndex('by_kind', (q) => q.eq('kind', kind))
		.unique();
	return row?.ingredients ?? [];
}

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
		// Returned whole so the Špajza page keeps filtering it in the browser with
		// `nameNorm.includes(query)`. A Convex search index would cut this to
		// ~600 B but only matches token prefixes, silently breaking the mid-word
		// match that makes typing „lej" suggest „olej".
		return corpusIngredients(ctx, 'knownIngredients');
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
		// Already ranked and capped at 40 by the importer, in tile order. The old
		// shape also carried each ingredient's `count`, which the tile grid never
		// read — the aggregate ranks with it and then drops it.
		return corpusIngredients(ctx, 'frequentIngredients');
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

		// Typing a name straight into the field sends no productType, so resolve it
		// from the precomputed corpus rather than scanning all 635 recipes for a
		// single string match. Unknown names fall back to „ostatné".
		let productType = args.productType;
		if (!productType) {
			const known = await corpusIngredients(ctx, 'knownIngredients');
			productType = known.find((entry) => entry.nameNorm === nameNorm)?.productType;
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
