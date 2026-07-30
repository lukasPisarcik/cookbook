/**
 * Resolver stub for SvelteKit's `$app/paths` virtual module.
 *
 * `resolve()` mirrors SvelteKit's route-id interpolation closely enough for
 * component tests: `resolve('/recepty/[slug]', { slug: 'x' })` → '/recepty/x'.
 *
 * See `tests/stubs/app-server.ts` for why these files exist.
 */

export const base = '';
export const assets = '';

export function resolve(id: string, params: Record<string, string> = {}): string {
	return id.replace(/\[(\w+)\]/g, (_, key: string) => params[key] ?? `[${key}]`);
}

export function asset(file: string): string {
	return file;
}
