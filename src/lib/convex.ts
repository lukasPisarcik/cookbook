import { setupConvex } from 'convex-svelte';
import { env } from '$env/dynamic/public';

/**
 * Central Convex client setup. This is the single place that reads
 * PUBLIC_CONVEX_URL (public env vars cannot go through env.server.ts).
 * Call from the root layout during component initialisation.
 */
export function initConvex(): void {
	const url = env.PUBLIC_CONVEX_URL;
	if (!url) {
		throw new Error('PUBLIC_CONVEX_URL is not set — run `bunx convex dev` to provision it');
	}
	setupConvex(url);
}
