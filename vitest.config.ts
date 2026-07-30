import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, 'src');
const libDir = resolve(srcDir, 'lib');
const stubsDir = resolve(__dirname, 'tests/stubs');

/**
 * Static stubs for SvelteKit virtual modules (`$app/*`, `$env/*`).
 *
 * Without the full `sveltekit()` plugin, Vite cannot resolve these
 * specifiers. The stubs give the resolver a real file to land on;
 * tests then override behavior per-suite via `vi.mock('$app/...', ...)`.
 */
const svelteKitVirtualAliases = {
	'$app/server': resolve(stubsDir, 'app-server.ts'),
	'$app/environment': resolve(stubsDir, 'app-environment.ts'),
	'$app/state': resolve(stubsDir, 'app-state.ts'),
	'$app/stores': resolve(stubsDir, 'app-stores.ts'),
	'$app/navigation': resolve(stubsDir, 'app-navigation.ts'),
	'$app/paths': resolve(stubsDir, 'app-paths.ts'),
	'$env/dynamic/private': resolve(stubsDir, 'env-dynamic-private.ts'),
	'$env/dynamic/public': resolve(stubsDir, 'env-dynamic-public.ts'),
	'$env/static/private': resolve(stubsDir, 'env-static-private.ts'),
	'$env/static/public': resolve(stubsDir, 'env-static-public.ts')
};

/**
 * Vitest configuration with two projects:
 *
 *   - `server`  Node environment for server-side unit tests (services,
 *               helpers, schemas, route handlers, remote functions).
 *               Uses the plain `svelte` Vite plugin (no SvelteKit remote-
 *               function/routing validation) so `.remote.ts` files can
 *               be imported directly. SvelteKit virtual modules are
 *               stubbed in `tests/setup-server.ts`.
 *
 *   - `client`  Real Chromium (via Playwright) for Svelte component and
 *               page tests. Uses the full SvelteKit Vite plugin so
 *               `$app/*` virtuals resolve naturally.
 *
 * Cypress (`cypress.config.ts`) still owns end-to-end smoke flows that
 * exercise the full SvelteKit SSR pipeline.
 *
 * Sveltest alignment: https://sveltest.dev/llms.txt
 */
export default defineConfig({
	test: {
		coverage: {
			// Istanbul instead of v8 because the server unit-test job runs in
			// the `oven/bun:1` container, and Bun's `node:inspector` stub
			// throws "Coverage APIs are not supported" on the V8 Coverage API
			// that `@vitest/coverage-v8` requires. Istanbul instruments at the
			// transform layer and works on both Bun and Node.
			provider: 'istanbul',
			// `cobertura` is what Azure DevOps' PublishCodeCoverageResults@2
			// consumes; the others are kept for local HTML browsing and IDE
			// integrations.
			reporter: ['text', 'html', 'lcov', 'clover', 'cobertura'],
			exclude: [
				'src/lib/components/**',
				'src/lib/dictionary/dictionary.svelte.ts',
				'**/*.test.{ts,js,svelte}',
				'**/*.spec.{ts,js,svelte}',
				'**/*.stories.{ts,js,svelte}',
				'**/test-utils/**',
				'**/*.harness.svelte',
				'**/*.stub.*',
				'**/__tests__/**',
				'**/__mocks__/**',
				'**/__fixtures__/**',
				'**/__snapshots__/**',
				'**/__screenshots__/**',
				'.vitest-attachments/**',
				'tests/**',
				'cypress/**'
			],
			// Thresholds sit a few points below current numbers so a routine
			// PR doesn't flicker red, but a real coverage regression fails CI.
			// Bump these as the suite grows; never lower them.
			thresholds: {
				lines: 85,
				statements: 85,
				functions: 80,
				branches: 75
			}
		},
		projects: [
			{
				plugins: [svelte({ hot: false })],
				resolve: {
					alias: {
						$lib: libDir,
						...svelteKitVirtualAliases
					}
				},
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: [
						'node_modules/**',
						'build/**',
						'.svelte-kit/**',
						'cypress/**',
						'src/**/*.svelte.test.ts'
					],
					setupFiles: ['./tests/setup-server.ts']
				}
			},
			{
				plugins: [sveltekit()],
				test: {
					name: 'client',
					include: ['src/**/*.svelte.test.ts'],
					exclude: ['node_modules/**', 'build/**', '.svelte-kit/**', 'cypress/**'],
					setupFiles: ['./tests/setup-browser.ts'],
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: 'chromium' }]
					}
				}
			}
		]
	}
});
