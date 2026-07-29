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
export const MeetingLanguageCode = z.enum(['en_us']);
export type MeetingLanguageCode = z.infer<typeof MeetingLanguageCode>;
export const DEFAULT_MEETING_LANGUAGE_CODE: MeetingLanguageCode = 'en_us';

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
