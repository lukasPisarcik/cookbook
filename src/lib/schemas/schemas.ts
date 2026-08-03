import z from 'zod';

// =============================================================================
// Common input schema for remote functions / forms that take no params.
// =============================================================================

export const EmptyInput = z.object({});
export type EmptyInput = z.infer<typeof EmptyInput>;

// =============================================================================
// UI primitives (used by toast helper).
// =============================================================================

export const ToastVariant = z.enum(['default', 'success', 'error', 'warning', 'info']);
export type ToastVariant = z.infer<typeof ToastVariant>;

// =============================================================================
// Theme (used by themeStore).
// =============================================================================

export const ThemeSchema = z.enum(['light', 'dark']);
export type Theme = z.infer<typeof ThemeSchema>;

// =============================================================================
// Language (used by langStore — kept only when i18n is enabled).
// =============================================================================

export const TextDirection = z.enum(['ltr', 'rtl']);
export type TextDirection = z.infer<typeof TextDirection>;

/**
 * UI language code in `<language>_<country>` format.
 * - Language uses ISO 639-1 (2 chars) when available; otherwise ISO 639-2/3.
 * - Country uses ISO 3166-1 alpha-2 (2 chars).
 */
export const MeetingLanguageCode = z.enum(['sk_sk', 'en_us']);
export type MeetingLanguageCode = z.infer<typeof MeetingLanguageCode>;
export const DEFAULT_MEETING_LANGUAGE_CODE: MeetingLanguageCode = 'sk_sk';

export const LanguageConfigEntry = z.object({
	label: z.string(),
	flag: z.string(),
	dir: TextDirection
});
export type LanguageConfigEntry = z.infer<typeof LanguageConfigEntry>;

export const LanguageConfig = z.record(MeetingLanguageCode, LanguageConfigEntry);
export type LanguageConfig = z.infer<typeof LanguageConfig>;

// =============================================================================
// UUID
// =============================================================================

export const UUID = z.uuid();

// =============================================================================
// Error page categories (used by +error.svelte and src/lib/errors/page.ts).
// =============================================================================

export const ErrorCategory = z.enum([
	'auth',
	'forbidden',
	'not_found',
	'validation',
	'server',
	'unknown'
]);
export type ErrorCategory = z.infer<typeof ErrorCategory>;

export interface ErrorMetadata {
	category: ErrorCategory;
	titleKey: string;
	descriptionKey: string;
	whatHappenedKey: string;
	whatToDoKey: string;
	showRetry: boolean;
	showHome: boolean;
	showSupport: boolean;
}

// =============================================================================
// Add your domain schemas below this line.
// Convention: every Zod schema lives in this file (one source of truth).
// See `.claude/docs/schemas.md` for details.
// =============================================================================

// =============================================================================
// Auth (shared-password gate).
// =============================================================================

export const LoginInput = z.object({
	password: z.string().min(1)
});
export type LoginInput = z.infer<typeof LoginInput>;

// =============================================================================
// Profile (used by profileStore).
//
// A profile is a *preference*, not a credential: the shared password is the
// only boundary, and the client sends `userId` to Convex unverified. It exists
// so two people sharing the deployment keep separate favourites, „Dnes varím"
// selections, špajza and shopping lists.
// =============================================================================

export const ProfileSchema = z.object({
	/** slugify(name) — the stable key sent to Convex. */
	userId: z.string().min(1).max(40),
	/** Display name as typed, diacritics intact. */
	name: z.string().min(1).max(40)
});
export type Profile = z.infer<typeof ProfileSchema>;

/** The „Kto si?" prompt's text input. */
export const ProfileNameInput = z.object({
	name: z.string().trim().min(1).max(40)
});
export type ProfileNameInput = z.infer<typeof ProfileNameInput>;

/** The `mnamka_profiles` roster — previously used names, offered by the switcher. */
export const ProfileRosterSchema = z.array(ProfileSchema);
export type ProfileRoster = z.infer<typeof ProfileRosterSchema>;

// =============================================================================
// Recipes (seed contract + shared enums).
//
// `RecipeSeedSchema` is the contract the offline extraction pipeline must
// satisfy (`seed/recipes/*.json`). The import script refuses any file that
// fails it, so extraction errors surface before the database. Matching keys
// (slug, searchText, nameNorm) are computed by the import script, not by
// extraction — they are deliberately absent here.
// =============================================================================

export const RecipeCategory = z.enum([
	'ranajky',
	'obedy',
	'vecere',
	'snacky',
	'smoothies',
	'drinky',
	'dezerty',
	'zaklady'
]);
export type RecipeCategory = z.infer<typeof RecipeCategory>;

export const MacrosSchema = z.object({
	/** Sacharidy, grams per portion. */
	carbs: z.number().min(0).max(500),
	/** Bielkoviny, grams per portion. */
	protein: z.number().min(0).max(500),
	/** Tuky, grams per portion. */
	fat: z.number().min(0).max(500)
});
export type Macros = z.infer<typeof MacrosSchema>;

export const IngredientSeedSchema = z.object({
	name: z.string().min(1),
	quantity: z.number().positive().optional(),
	/** g | ml | ks | konzerva | PL | ČL | … as printed in the source. */
	unit: z.string().min(1).optional(),
	/** Druh produktu — grouping key; filled from the workbook taxonomy when absent. */
	productType: z.string().min(1).optional()
});
export type IngredientSeed = z.infer<typeof IngredientSeedSchema>;

export const VariantSeedSchema = z.object({
	/** "400 kcal" | "500 kcal" | "600 kcal" | "štandard". */
	label: z.string().min(1),
	kcalPerPortion: z.number().min(50).max(1500).optional(),
	portions: z.number().positive().max(50).optional(),
	macros: MacrosSchema.optional(),
	ingredients: z.array(IngredientSeedSchema).min(1)
});
export type VariantSeed = z.infer<typeof VariantSeedSchema>;

/**
 * The precomputed corpus aggregates the importer pushes to `corpusMeta`.
 * Validated before the push so a malformed aggregate fails locally rather than
 * silently emptying the filter chips, autocomplete and „Časté" tiles.
 */
export const CorpusIngredientSchema = z.object({
	name: z.string().min(1),
	nameNorm: z.string().min(1),
	productType: z.string().min(1)
});
export type CorpusIngredientSeed = z.infer<typeof CorpusIngredientSchema>;

export const CorpusAggregatesSchema = z.object({
	recipeCount: z.number().int().positive(),
	dietTags: z.array(z.string().min(1)),
	knownIngredients: z.array(CorpusIngredientSchema),
	frequentIngredients: z.array(CorpusIngredientSchema)
});
export type CorpusAggregatesSeed = z.infer<typeof CorpusAggregatesSchema>;

export const RecipeSeedSchema = z.object({
	title: z.string().min(1),
	category: RecipeCategory,
	/** bezlepkove | bezlaktozove | vegan | … normalized, diacritics stripped. Absent = none. */
	dietTags: z.array(z.string().min(1)).default([]),
	prepTimeMinutes: z
		.number()
		.positive()
		.max(24 * 60)
		.optional(),
	steps: z.array(z.string().min(1)),
	/** „Vedela si, že…" box when present. */
	funFact: z.string().optional(),
	variants: z.array(VariantSeedSchema).min(1),
	/** Path of the cover photo inside seed/images/, when one was extracted. */
	image: z.string().optional(),
	/** Source document filename. */
	source: z.string().min(1),
	/** Page / blueprint code (R1…R129) inside the source. */
	sourceRef: z.string().optional()
});
export type RecipeSeed = z.infer<typeof RecipeSeedSchema>;
