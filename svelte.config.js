import node from '@sveltejs/adapter-node';
import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Documented exception to hard rule 2 („all env vars go through
 * `src/lib/server/env.server.ts`").
 *
 * This file is *build-time* configuration, not application code, and cannot
 * import `env.server.ts` — that is a runtime module and would pull Zod into the
 * config graph. Vercel sets `VERCEL` in its own build environment, so keying
 * the adapter off it keeps both paths working from one config: Vercel builds
 * serverless functions, while the local zero-regression gate (`bun run e2e`)
 * still serves `node build/index.js` from adapter-node. The read is confined to
 * this one line.
 */
const onVercel = Boolean(process.env.VERCEL);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	compilerOptions: {
		experimental: {
			async: true
		}
	},
	kit: {
		adapter: onVercel ? vercel() : node(),
		alias: {
			$convex: './convex/_generated'
		},
		experimental: {
			remoteFunctions: true
		}
	}
};

export default config;
