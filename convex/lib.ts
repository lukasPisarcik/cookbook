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
	if (!expected || !constantTimeEquals(token, expected)) {
		throw new ConvexError('Invalid or missing app token');
	}
}

/**
 * Compare without leaking how much of the token matched. `!==` returns on the
 * first differing byte, which is the same shape of side channel the login
 * password check already avoids; the guard is kept consistent across both.
 */
function constantTimeEquals(candidate: string, expected: string): boolean {
	if (candidate.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < expected.length; i++) {
		diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}
