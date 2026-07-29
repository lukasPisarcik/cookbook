/**
 * Resolver stub for SvelteKit's `$app/server` virtual module.
 *
 * Actual behavior is installed per-test (or globally in
 * `tests/setup-server.ts`) via `vi.mock('$app/server', ...)`. This file
 * exists so Vite's resolver can find `$app/server` in the server test
 * project (the Kit Vite plugin is not active there).
 */

export const command = <T>(_schema: unknown, fn: T): T => fn;
export const query = <T>(_schema: unknown, fn: T): T => fn;
export const form = <T>(_schema: unknown, fn: T): T => fn;
export function getRequestEvent(): never {
	throw new Error('getRequestEvent is not available during unit tests');
}
