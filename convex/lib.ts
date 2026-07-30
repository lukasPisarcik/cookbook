import { ConvexError } from 'convex/values';

/**
 * Token guard for public Convex functions.
 *
 * The SvelteKit password gate cannot protect direct calls to the public
 * Convex deployment (its URL ships in the client bundle), so every public
 * function requires the shared APP_TOKEN, which the SvelteKit server hands
 * to the client only after login. Configure APP_TOKEN in the Convex
 * dashboard environment.
 */
export function requireToken(token: string): void {
	const expected = process.env.APP_TOKEN;
	if (!expected || token !== expected) {
		throw new ConvexError('Invalid or missing app token');
	}
}
