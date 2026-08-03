/**
 * Validate, merge and import the extraction output into Convex.
 *
 * - Zod-validates every `seed/recipes/**\/*.json` against RecipeSeedSchema
 *   (any failure aborts with a non-zero exit — extraction errors surface
 *   before the database).
 * - Merges the kcal-group PDFs of the same dish into one recipe with
 *   variants (slug = kcal-stripped normalized title).
 * - Reconciles against `seed/blueprint.json`: blueprint ingredients are
 *   authoritative for the 129 coded recipes, blueprint category wins, and
 *   codes with no scraped counterpart import as ingredient-only recipes.
 * - Fills ingredient product types from the workbook taxonomy.
 * - Uploads cover photos to Convex storage (cached per deployment in
 *   `.extract-cache/image-uploads.json`) and upserts recipes by slug —
 *   idempotent, safe to re-run; user state is preserved.
 * - Writes the thin `recipeCards` projection alongside each recipe, and the
 *   three precomputed `corpusMeta` aggregates once at the end — both exist so
 *   the app's read path never scans the whole corpus.
 * - Prints per-source counts and an anomaly report.
 *
 * Usage: bun tools/seed/import.ts [--dry-run] [--user <profileId>]
 *                                 [--limit N [--prune]]
 *        (--user defaults to `lukas` — it owns the pre-flagged „Dnes varím"
 *        recipes and the starter pantry, which are per-profile state)
 *
 *   --limit N   import a deterministic N-recipe subset (dev deployments): the
 *               pinned gate fixtures plus a round-robin across categories.
 *   --prune     delete the documents outside that subset. Required for --limit
 *               to actually shrink a deployment — the importer otherwise only
 *               ever upserts, so previously imported recipes would remain.
 *
 * Full corpus to prod, a 40-recipe subset to dev:
 *   bun tools/seed/import.ts
 *   bun tools/seed/import.ts --limit 40 --prune
 */

import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import {
	CorpusAggregatesSchema,
	RecipeSeedSchema,
	type RecipeSeed
} from '../../src/lib/schemas/schemas';
import { normalizeName, slugify, stripKcalSuffix } from '../../src/lib/helpers/normalize';
import { computeCorpusAggregates } from '../../src/lib/helpers/corpus';
import type { Blueprint } from '../extract/parse-xlsx';

const SEED_DIR = 'seed/recipes';
const IMAGES_DIR = 'seed/images';
const UPLOAD_CACHE = '.extract-cache/image-uploads.json';
const FALLBACK_PRODUCT_TYPE = 'ostatné';

const dryRun = process.argv.includes('--dry-run');

/**
 * Which profile the blueprint's pre-flagged „Dnes varím" recipes and starter
 * pantry belong to. Personal state is per-user now, so both writes need an
 * owner; `lukas` is the profile the one-shot migration adopted the legacy rows
 * into.
 */
const userIdFlag = process.argv.indexOf('--user');
const userId = userIdFlag === -1 ? 'lukas' : (process.argv[userIdFlag + 1] ?? '');
if (userId.trim() === '') {
	console.error('✗ --user needs a profile id, e.g. --user lukas');
	process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Load + validate every seed file
// ---------------------------------------------------------------------------

interface SeedFile {
	path: string;
	batch: string;
	seed: RecipeSeed;
}

function sourceRank(batch: string): number {
	if (batch.startsWith('ind-')) return 0;
	if (batch.startsWith('comp-')) return 1;
	if (batch.startsWith('krab-')) return 2;
	if (batch.startsWith('onvia-')) return 3;
	return 4;
}

const files: SeedFile[] = [];
const validationErrors: string[] = [];

for (const batch of readdirSync(SEED_DIR)) {
	const batchDir = join(SEED_DIR, batch);
	let entries: string[];
	try {
		entries = readdirSync(batchDir).filter((name) => name.endsWith('.json'));
	} catch {
		continue;
	}
	for (const name of entries) {
		const path = join(batchDir, name);
		try {
			const parsed = RecipeSeedSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
			if (!parsed.success) {
				validationErrors.push(
					`${path}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
				);
			} else {
				files.push({ path, batch, seed: parsed.data });
			}
		} catch (error) {
			validationErrors.push(`${path}: unreadable JSON (${String(error)})`);
		}
	}
}

if (validationErrors.length > 0) {
	console.error(`\n✗ ${validationErrors.length} seed file(s) failed RecipeSeedSchema validation:`);
	for (const error of validationErrors) console.error(`  - ${error}`);
	process.exit(1);
}
console.log(`✓ ${files.length} seed files validated`);

// ---------------------------------------------------------------------------
// 2. Merge files into dishes (variants merged by slug)
// ---------------------------------------------------------------------------

interface Variant {
	label: string;
	kcalPerPortion?: number;
	portions?: number;
	macros?: { carbs: number; protein: number; fat: number };
	ingredients: {
		name: string;
		nameNorm: string;
		quantity?: number;
		unit?: string;
		productType: string;
	}[];
}

interface Dish {
	slug: string;
	title: string;
	category: string;
	dietTags: Set<string>;
	prepTimeMinutes?: number;
	steps: string[];
	funFact?: string;
	variants: Map<string, { rank: number; variant: Variant }>;
	image?: string;
	imageRank: number;
	source: string;
	sourceRef?: string;
	rank: number;
}

const blueprint: Blueprint = JSON.parse(readFileSync('seed/blueprint.json', 'utf8'));

const taxonomy = new Map<string, string>();
for (const ingredients of Object.values(blueprint.ingredientsByCode)) {
	for (const ingredient of ingredients) {
		const norm = normalizeName(ingredient.name);
		if (!taxonomy.has(norm)) taxonomy.set(norm, ingredient.productType);
	}
}

function enrichIngredient(ingredient: {
	name: string;
	quantity?: number;
	unit?: string;
	productType?: string;
}) {
	const nameNorm = normalizeName(ingredient.name);
	return {
		name: ingredient.name,
		nameNorm,
		quantity: ingredient.quantity,
		unit: ingredient.unit,
		productType: ingredient.productType ?? taxonomy.get(nameNorm) ?? FALLBACK_PRODUCT_TYPE
	};
}

const dishes = new Map<string, Dish>();

const sortedFiles = files.toSorted((a, b) => {
	const rankDiff = sourceRank(a.batch) - sourceRank(b.batch);
	if (rankDiff !== 0) return rankDiff;
	return b.seed.steps.length - a.seed.steps.length;
});

for (const file of sortedFiles) {
	const { seed, batch } = file;
	const rank = sourceRank(batch);
	const slug = slugify(seed.title);
	if (!slug) {
		console.error(`✗ ${file.path}: empty slug from title "${seed.title}"`);
		process.exit(1);
	}
	const title = stripKcalSuffix(seed.title);

	let dish = dishes.get(slug);
	if (!dish) {
		dish = {
			slug,
			title,
			category: seed.category,
			dietTags: new Set(seed.dietTags),
			prepTimeMinutes: seed.prepTimeMinutes,
			steps: seed.steps,
			funFact: seed.funFact,
			variants: new Map(),
			image: seed.image,
			imageRank: seed.image ? rank : Number.MAX_SAFE_INTEGER,
			source: seed.source,
			sourceRef: seed.sourceRef,
			rank
		};
		dishes.set(slug, dish);
	} else {
		for (const tag of seed.dietTags) dish.dietTags.add(tag);
		dish.prepTimeMinutes ??= seed.prepTimeMinutes;
		dish.funFact ??= seed.funFact;
		if (seed.steps.length > dish.steps.length && rank <= dish.rank) dish.steps = seed.steps;
		if (seed.image && rank < dish.imageRank) {
			dish.image = seed.image;
			dish.imageRank = rank;
		}
	}

	for (const variant of seed.variants) {
		const label = variant.label.trim();
		const enriched: Variant = {
			label,
			kcalPerPortion: variant.kcalPerPortion,
			portions: variant.portions,
			macros: variant.macros,
			ingredients: mergeDuplicateIngredients(variant.ingredients.map(enrichIngredient))
		};
		const existing = dish.variants.get(label);
		if (
			!existing ||
			rank < existing.rank ||
			(rank === existing.rank && enriched.ingredients.length > existing.variant.ingredients.length)
		) {
			dish.variants.set(label, { rank, variant: enriched });
		}
	}
}

console.log(`✓ merged into ${dishes.size} dishes`);

// ---------------------------------------------------------------------------
// 3. Blueprint reconciliation (authoritative ingredients, category, codes)
// ---------------------------------------------------------------------------

/** Sources occasionally list the same ingredient twice in one variant
 * (e.g. salt in the dough and on top) — sum them so keyed UI lists and the
 * shopping aggregation see unique (nameNorm, unit) rows. */
function mergeDuplicateIngredients(ingredients: Variant['ingredients']): Variant['ingredients'] {
	const byKey = new Map<string, Variant['ingredients'][number]>();
	for (const ingredient of ingredients) {
		const key = `${ingredient.nameNorm}|${ingredient.unit ?? ''}`;
		const existing = byKey.get(key);
		if (existing) {
			if (ingredient.quantity !== undefined) {
				existing.quantity = (existing.quantity ?? 0) + ingredient.quantity;
			}
		} else {
			byKey.set(key, { ...ingredient });
		}
	}
	return [...byKey.values()];
}

const dishByNorm = new Map<string, Dish>();
for (const dish of dishes.values()) {
	dishByNorm.set(normalizeName(dish.title), dish);
}

/**
 * Fuzzy fallback for workbook typos („Chnocchi", „poliekva", „fittata") and
 * minor title drift („Pečený vajíčkový toast" vs scraped „Vajíčkový toast").
 * Conservative: bigram Dice similarity ≥ 0.7, best match only, and each dish
 * can absorb at most one blueprint code. Every fuzzy match is printed for
 * manual spot-checking.
 */
function bigrams(value: string): Set<string> {
	const compact = value.replace(/[^a-z0-9]/g, '');
	const grams = new Set<string>();
	for (let i = 0; i < compact.length - 1; i++) grams.add(compact.slice(i, i + 2));
	return grams;
}

function diceSimilarity(a: string, b: string): number {
	const gramsA = bigrams(a);
	const gramsB = bigrams(b);
	if (gramsA.size === 0 || gramsB.size === 0) return 0;
	let shared = 0;
	for (const gram of gramsA) if (gramsB.has(gram)) shared += 1;
	return (2 * shared) / (gramsA.size + gramsB.size);
}

const fuzzyClaimed = new Set<string>();
const fuzzyMatches: string[] = [];

function findDish(norm: string, code: string, title: string): Dish | undefined {
	const exact = dishByNorm.get(norm);
	// A dish already claimed by another blueprint code is not matchable again —
	// two distinct workbook recipes sharing a title must not collapse into one.
	if (exact && !exact.sourceRef?.startsWith('R')) return exact;
	let best: Dish | undefined;
	let bestScore = 0;
	for (const [dishNorm, dish] of dishByNorm) {
		if (fuzzyClaimed.has(dishNorm) || dish.sourceRef?.startsWith('R')) continue;
		const score = diceSimilarity(norm, dishNorm);
		if (score > bestScore) {
			bestScore = score;
			best = dish;
		}
	}
	if (best && bestScore >= 0.7) {
		fuzzyClaimed.add(normalizeName(best.title));
		fuzzyMatches.push(`${code} „${title}" → „${best.title}" (${bestScore.toFixed(2)})`);
		return best;
	}
	return undefined;
}

const blueprintOnly: string[] = [];
const blueprintMatched: string[] = [];

for (const recipe of blueprint.recipes) {
	const norm = normalizeName(stripKcalSuffix(recipe.title));
	const ingredients = (blueprint.ingredientsByCode[recipe.code] ?? []).map((ingredient) => ({
		name: ingredient.name,
		nameNorm: normalizeName(ingredient.name),
		quantity: ingredient.quantity,
		unit: ingredient.unit,
		productType: ingredient.productType
	}));

	const dish = findDish(norm, recipe.code, recipe.title);
	if (dish) {
		blueprintMatched.push(recipe.code);
		dish.category = recipe.category;
		dish.sourceRef = recipe.code;

		// Blueprint ingredients are authoritative for the variant whose kcal
		// is closest to the workbook's kcal/portion (or the only variant).
		if (ingredients.length > 0) {
			const candidates = [...dish.variants.values()];
			let target = candidates[0];
			if (recipe.kcalPerPortion !== undefined && candidates.length > 1) {
				target = candidates.toSorted((a, b) => {
					const da = Math.abs((a.variant.kcalPerPortion ?? 10_000) - recipe.kcalPerPortion!);
					const db = Math.abs((b.variant.kcalPerPortion ?? 10_000) - recipe.kcalPerPortion!);
					return da - db;
				})[0];
			}
			target.variant.ingredients = ingredients;
			target.variant.kcalPerPortion ??= recipe.kcalPerPortion;
		}
	} else {
		// No scraped counterpart — import as ingredient-only from the workbook.
		blueprintOnly.push(`${recipe.code} ${recipe.title}`);
		if (ingredients.length === 0) continue;
		let slug = slugify(recipe.title);
		if (dishes.has(slug)) {
			slug = `${slug}-${recipe.code.toLowerCase()}`;
		}
		dishes.set(slug, {
			slug,
			title: stripKcalSuffix(recipe.title).trim(),
			category: recipe.category,
			dietTags: new Set(),
			steps: [],
			variants: new Map([
				[
					'štandard',
					{
						rank: 5,
						variant: {
							label: 'štandard',
							kcalPerPortion: recipe.kcalPerPortion,
							ingredients
						}
					}
				]
			]),
			imageRank: Number.MAX_SAFE_INTEGER,
			source: 'Zoznam receptov.xlsx',
			sourceRef: recipe.code,
			rank: 5
		});
	}
}

console.log(
	`✓ blueprint: ${blueprintMatched.length}/${blueprint.recipes.length} matched to scraped recipes, ${blueprintOnly.length} ingredient-only`
);
if (fuzzyMatches.length > 0) {
	console.log(`fuzzy title matches (spot-check these) — ${fuzzyMatches.length}:`);
	for (const match of fuzzyMatches) console.log(`  - ${match}`);
}

// ---------------------------------------------------------------------------
// 4. Build final recipe docs
// ---------------------------------------------------------------------------

function variantSortKey(variant: Variant): number {
	return variant.kcalPerPortion ?? (variant.label === 'štandard' ? 9_999 : 9_000);
}

// The workbook's „Varím?" ticks become the initial Dnes-varím flags
// (applied only when a recipe is first inserted — never overwrites app state).
const cookingBySlug = new Map<string, number | undefined>();
for (const recipe of blueprint.recipes) {
	if (recipe.cooking) {
		cookingBySlug.set(slugify(recipe.title), recipe.kcalPerPortion);
	}
}

const finalRecipes = [...dishes.values()].map((dish) => ({
	slug: dish.slug,
	title: dish.title,
	searchText: normalizeName(dish.title),
	category: dish.category,
	dietTags: [...dish.dietTags].sort(),
	prepTimeMinutes: dish.prepTimeMinutes,
	steps: dish.steps,
	funFact: dish.funFact,
	variants: [...dish.variants.values()]
		.map((entry) => entry.variant)
		.toSorted((a, b) => variantSortKey(a) - variantSortKey(b)),
	imagePath:
		dish.image && existsSync(join(IMAGES_DIR, dish.image))
			? join(IMAGES_DIR, dish.image)
			: undefined,
	imageWanted: dish.image,
	source: dish.source,
	sourceRef: dish.sourceRef
}));

// ---------------------------------------------------------------------------
// 5. Optional dev subset (--limit) and the precomputed corpus aggregates
// ---------------------------------------------------------------------------

/**
 * Slugs the validation gate hard-codes and therefore may never be dropped by
 * `--limit`: `tools/verify/ui-proof.mjs` navigates to /recepty/thajske-kari and
 * asserts four times on `article img`. If those assertions fail, the fix is
 * this list — never a relaxed assertion.
 */
const PINNED_SLUGS = ['thajske-kari'];

type FinalRecipe = (typeof finalRecipes)[number];

/**
 * Deterministically pick `limit` recipes, in three passes:
 *
 *  1. the pinned gate fixtures,
 *  2. one recipe per diet tag, so the filter chips keep every value,
 *  3. round-robin across categories (each bucket ordered by slug) so every
 *     category chip — „Dezerty" included — still has something behind it.
 *
 * Pass 2 is not optional: a plain category round-robin over 40 recipes happens
 * to surface only two of the four diet tags, and the gate asserts on all four.
 */
function selectSubset(recipes: FinalRecipe[], limit: number): FinalRecipe[] {
	const bySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));
	const orderedBySlug = recipes.toSorted((a, b) => a.slug.localeCompare(b.slug));
	const selected: FinalRecipe[] = [];
	const taken = new Set<string>();

	for (const slug of PINNED_SLUGS) {
		const pinned = bySlug.get(slug);
		if (!pinned) {
			console.error(
				`✗ --limit: pinned slug "${slug}" is not in the corpus — the UI proof needs it`
			);
			process.exit(1);
		}
		if (!pinned.imagePath) {
			console.error(`✗ --limit: pinned slug "${slug}" has no photo — the UI proof asserts on one`);
			process.exit(1);
		}
		selected.push(pinned);
		taken.add(slug);
	}

	const allTags = [...new Set(recipes.flatMap((recipe) => recipe.dietTags))].sort();
	const coveredTags = new Set(selected.flatMap((recipe) => recipe.dietTags));
	for (const tag of allTags) {
		if (coveredTags.has(tag)) continue;
		const candidate = orderedBySlug.find(
			(recipe) => !taken.has(recipe.slug) && recipe.dietTags.includes(tag)
		);
		if (!candidate) continue;
		selected.push(candidate);
		taken.add(candidate.slug);
		for (const covered of candidate.dietTags) coveredTags.add(covered);
	}

	if (selected.length > limit) {
		console.error(
			`✗ --limit ${limit} is too small: ${selected.length} recipes are needed to cover the` +
				` pinned slugs and all ${allTags.length} diet tags the gate asserts on`
		);
		process.exit(1);
	}

	const byCategory = new Map<string, FinalRecipe[]>();
	for (const recipe of orderedBySlug) {
		if (taken.has(recipe.slug)) continue;
		const bucket = byCategory.get(recipe.category);
		if (bucket) bucket.push(recipe);
		else byCategory.set(recipe.category, [recipe]);
	}

	const categories = [...byCategory.keys()].sort();
	for (let round = 0; selected.length < limit; round++) {
		let progressed = false;
		for (const category of categories) {
			if (selected.length >= limit) break;
			const bucket = byCategory.get(category)!;
			if (round < bucket.length) {
				selected.push(bucket[round]);
				progressed = true;
			}
		}
		// Every bucket exhausted — the corpus is smaller than the limit.
		if (!progressed) break;
	}

	return selected;
}

const limitFlagIndex = process.argv.indexOf('--limit');
let limit: number | undefined;
if (limitFlagIndex !== -1) {
	limit = Number(process.argv[limitFlagIndex + 1]);
	if (!Number.isInteger(limit) || limit <= 0) {
		console.error('✗ --limit needs a positive integer, e.g. --limit 40');
		process.exit(1);
	}
}

/**
 * `--prune` deletes the documents outside the selected set. Without it
 * `--limit` saves nothing on a deployment that already holds the full corpus:
 * the importer upserts by slug and never deletes, so the other 595 recipes
 * would simply stay.
 */
const prune = process.argv.includes('--prune');
if (prune && limit === undefined) {
	console.error('✗ --prune only makes sense together with --limit');
	process.exit(1);
}

const selectedRecipes = limit === undefined ? finalRecipes : selectSubset(finalRecipes, limit);
if (limit !== undefined) {
	console.log(
		`✓ --limit ${limit}: ${selectedRecipes.length} of ${finalRecipes.length} recipes selected` +
			` (pinned: ${PINNED_SLUGS.join(', ')})${prune ? ', pruning the rest' : ''}`
	);
	if (!prune) {
		console.log(
			'  ! without --prune, recipes already in the deployment are left in place — see the runbook'
		);
	}
}

/**
 * Precompute the three static aggregates the app used to derive at read time by
 * scanning the whole corpus. Computed here because the importer already holds
 * every merged recipe in memory, so it costs no database I/O — and the logic is
 * a pure function the server test project covers (`corpus.test.ts`).
 *
 * Computed from the *selected* set, so a `--limit` dev deployment never
 * autocompletes ingredients from recipes it does not have.
 */
const aggregates = computeCorpusAggregates(selectedRecipes);
const aggregatesCheck = CorpusAggregatesSchema.safeParse(aggregates);
if (!aggregatesCheck.success) {
	console.error('✗ computed corpus aggregates failed CorpusAggregatesSchema validation:');
	for (const issue of aggregatesCheck.error.issues) {
		console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
	}
	process.exit(1);
}
console.log(
	`✓ aggregates: ${aggregates.dietTags.length} diet tags, ` +
		`${aggregates.knownIngredients.length} distinct ingredients, ` +
		`${aggregates.frequentIngredients.length} frequent tiles`
);

// ---------------------------------------------------------------------------
// 6. Import into Convex
// ---------------------------------------------------------------------------

const convexUrl = Bun.env.PUBLIC_CONVEX_URL;
const token = Bun.env.APP_TOKEN;
if (!dryRun && (!convexUrl || !token)) {
	console.error('✗ PUBLIC_CONVEX_URL / APP_TOKEN missing (check .env / .env.local)');
	process.exit(1);
}

async function run() {
	let inserted = 0;
	let updated = 0;
	const uploadedImages = new Map<string, string>();

	if (!dryRun) {
		const client = new ConvexHttpClient(convexUrl!);

		// Image upload cache (per deployment) keeps re-runs cheap + idempotent.
		let cache: Record<string, Record<string, string>> = {};
		if (existsSync(UPLOAD_CACHE)) {
			cache = JSON.parse(readFileSync(UPLOAD_CACHE, 'utf8'));
		}
		const deploymentCache = (cache[convexUrl!] ??= {});

		for (const recipe of selectedRecipes) {
			if (!recipe.imagePath) continue;
			if (deploymentCache[recipe.imagePath]) {
				uploadedImages.set(recipe.imagePath, deploymentCache[recipe.imagePath]);
				continue;
			}
			const uploadUrl = await client.mutation(api.seed.generateUploadUrl, { token: token! });
			const body = readFileSync(recipe.imagePath);
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'image/webp' },
				body
			});
			if (!response.ok) {
				console.error(`✗ image upload failed for ${recipe.imagePath}: ${response.status}`);
				process.exit(1);
			}
			const { storageId } = (await response.json()) as { storageId: string };
			uploadedImages.set(recipe.imagePath, storageId);
			deploymentCache[recipe.imagePath] = storageId;
			mkdirSync('.extract-cache', { recursive: true });
			writeFileSync(UPLOAD_CACHE, JSON.stringify(cache, null, '\t'));
		}
		console.log(`✓ images: ${uploadedImages.size} available (uploaded or cached)`);

		for (const recipe of selectedRecipes) {
			const result = await client.mutation(api.seed.upsertRecipe, {
				token: token!,
				recipe: {
					slug: recipe.slug,
					title: recipe.title,
					searchText: recipe.searchText,
					category: recipe.category,
					dietTags: recipe.dietTags,
					prepTimeMinutes: recipe.prepTimeMinutes,
					steps: recipe.steps,
					funFact: recipe.funFact,
					variants: recipe.variants,
					imageId: recipe.imagePath ? (uploadedImages.get(recipe.imagePath) as never) : undefined,
					source: recipe.source,
					sourceRef: recipe.sourceRef
				}
			});
			if (result.action === 'inserted') {
				inserted += 1;
				if (cookingBySlug.has(recipe.slug)) {
					const targetKcal = cookingBySlug.get(recipe.slug);
					let variantIndex = 0;
					if (targetKcal !== undefined) {
						let best = Number.MAX_SAFE_INTEGER;
						recipe.variants.forEach((variant, index) => {
							const distance = Math.abs((variant.kcalPerPortion ?? 10_000) - targetKcal);
							if (distance < best) {
								best = distance;
								variantIndex = index;
							}
						});
					}
					await client.mutation(api.recipes.setCookingToday, {
						token: token!,
						userId,
						slug: recipe.slug,
						value: { variantIndex, portionMultiplier: 1 }
					});
				}
			} else {
				updated += 1;
			}
		}

		for (const item of blueprint.pantry) {
			await client.mutation(api.seed.upsertPantryItem, {
				token: token!,
				userId,
				name: item.name,
				nameNorm: normalizeName(item.name),
				productType: item.productType
			});
		}
		console.log(`✓ pantry: ${blueprint.pantry.length} items upserted for profile „${userId}"`);

		// Prune before writing the aggregates, so a failure here can never leave
		// aggregates that describe a corpus wider than what is actually stored.
		if (prune) {
			const { deletedRecipes, deletedCards } = await client.mutation(api.seed.pruneRecipes, {
				token: token!,
				keepSlugs: selectedRecipes.map((recipe) => recipe.slug)
			});
			console.log(`✓ pruned: ${deletedRecipes} recipes, ${deletedCards} card rows deleted`);
		}

		// Last, and in one mutation: the queries read these instead of scanning the
		// corpus, so they must describe the corpus that is now stored.
		await client.mutation(api.seed.upsertCorpusMeta, {
			token: token!,
			recipeCount: aggregates.recipeCount,
			dietTags: aggregates.dietTags,
			knownIngredients: aggregates.knownIngredients,
			frequentIngredients: aggregates.frequentIngredients
		});
		console.log(`✓ corpusMeta: 3 aggregate rows written for ${aggregates.recipeCount} recipes`);
	}

	// -------------------------------------------------------------------------
	// 7. Report
	// -------------------------------------------------------------------------

	console.log('\n=== Import report ===');
	console.log(
		`recipes: ${selectedRecipes.length} imported of ${finalRecipes.length} merged${dryRun ? ' (dry run — nothing written)' : ` (${inserted} inserted, ${updated} updated)`}`
	);

	const bySource = new Map<string, number>();
	for (const file of files) {
		bySource.set(file.seed.source, (bySource.get(file.seed.source) ?? 0) + 1);
	}
	console.log(`\nseed files per source document (${bySource.size} source documents):`);
	for (const [source, count] of [...bySource.entries()].sort((a, b) =>
		a[0].localeCompare(b[0], 'sk')
	)) {
		console.log(`  ${String(count).padStart(3)}  ${source}`);
	}

	console.log(
		`\nblueprint codes: ${blueprintMatched.length + blueprintOnly.length}/${blueprint.recipes.length} present in Convex`
	);
	if (blueprintOnly.length > 0) {
		console.log(`ingredient-only (no scraped steps/photo) — ${blueprintOnly.length}:`);
		for (const entry of blueprintOnly) console.log(`  - ${entry}`);
	}

	// Scoped to what was actually imported — with --limit, anomalies for recipes
	// that were never pushed are just noise. Identical for a full import.
	const missingPhoto = selectedRecipes.filter((recipe) => !recipe.imagePath);
	const missingMacros = selectedRecipes.filter((recipe) => recipe.variants.every((v) => !v.macros));
	const suspiciousKcal = selectedRecipes.filter((recipe) =>
		recipe.variants.some(
			(v) => v.kcalPerPortion !== undefined && (v.kcalPerPortion < 60 || v.kcalPerPortion > 1200)
		)
	);
	const wantedButMissing = selectedRecipes.filter(
		(recipe) => recipe.imageWanted && !recipe.imagePath
	);

	console.log(`\nanomalies for manual spot-check:`);
	console.log(`  missing photo: ${missingPhoto.length}`);
	for (const recipe of missingPhoto)
		console.log(
			`    - ${recipe.slug}${recipe.imageWanted ? ` (wanted ${recipe.imageWanted})` : ''}`
		);
	console.log(`  missing macros: ${missingMacros.length}`);
	for (const recipe of missingMacros) console.log(`    - ${recipe.slug}`);
	console.log(`  suspicious kcal: ${suspiciousKcal.length}`);
	for (const recipe of suspiciousKcal)
		console.log(
			`    - ${recipe.slug} (${recipe.variants.map((v) => v.kcalPerPortion).join(', ')})`
		);
	if (wantedButMissing.length > 0) {
		console.log(`  image referenced but file absent: ${wantedButMissing.length}`);
	}
}

await run();
