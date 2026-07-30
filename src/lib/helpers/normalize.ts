/**
 * Name/title normalization shared by search, dedup, variant merging and
 * pantry matching. Keep these pure — they run both in the app and in the
 * offline extraction/import tooling, and inside Convex functions.
 */

/** Strip diacritics: „Čučoriedková" → „Cucoriedkova". */
export function stripDiacritics(value: string): string {
	return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Lowercase, trim, collapse whitespace, strip diacritics — the canonical matching key. */
export function normalizeName(value: string): string {
	return stripDiacritics(value.trim().toLowerCase()).replace(/\s+/g, ' ');
}

/**
 * Remove a trailing calorie-group marker from a recipe title so the three
 * kcal-group PDFs of the same dish merge into one recipe:
 * „Thajské kari — 400 kcal" / „Thajské kari (500 kcal)" / „Thajské kari 600kcal"
 * all normalize to „Thajské kari".
 */
export function stripKcalSuffix(title: string): string {
	return title
		.replace(/\s*[-–—(]*\s*\d{3,4}\s*kcal\s*[)]*\s*$/i, '')
		.replace(/\s+$/, '')
		.trim();
}

/** URL-safe slug from a (possibly diacritic-heavy) title. */
export function slugify(title: string): string {
	return normalizeName(stripKcalSuffix(title))
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
