/**
 * Resolver stub for SvelteKit's `$app/state` virtual module.
 *
 * See `tests/stubs/app-server.ts` for why these files exist.
 */

export const page = {
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	route: { id: null as string | null }
};
export const navigating = null;
export const updated = { current: false };
