/**
 * Vitest setup (server project) - stubs SvelteKit-only virtual modules.
 *
 * SvelteKit exposes modules like `$app/server`, `$env/dynamic/private`,
 * etc. via its Vite plugin at build time. When Vitest runs server-side
 * TypeScript units directly (no SvelteKit app bootstrap), those virtual
 * modules don't exist on disk, so we stub them here.
 *
 * Registered via `vitest.config.ts` → `projects[0].setupFiles`.
 */

import { vi } from 'vitest';

// `Bun.env` polyfill for Node workers. Under Bun, `globalThis.Bun` is a
// read-only native binding and `Bun.env` already aliases `process.env`,
// so we leave it alone. Under Node (no Bun global), we alias it manually
// so production code reading `Bun.env` works in tests.
if (!(globalThis as { Bun?: unknown }).Bun) {
	(globalThis as { Bun?: { env: NodeJS.ProcessEnv } }).Bun = { env: process.env };
}

// `$app/server` exposes `command`, `query`, `form`, `getRequestEvent` used
// by remote functions. None of those actually execute during unit tests
// since we test services directly, but the module must still resolve.
vi.mock('$app/server', () => ({
	command: (_schema: unknown, fn: (...args: unknown[]) => unknown) => fn,
	query: (_schema: unknown, fn: (...args: unknown[]) => unknown) => fn,
	form: (_schema: unknown, fn: (...args: unknown[]) => unknown) => fn,
	getRequestEvent: () => {
		throw new Error('getRequestEvent is not available during unit tests');
	}
}));

vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$app/stores', () => ({
	page: { subscribe: () => () => {} },
	navigating: { subscribe: () => () => {} },
	updated: { subscribe: () => () => {} }
}));

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/'), params: {}, route: { id: null } },
	navigating: null,
	updated: { current: false }
}));

vi.mock('$app/navigation', () => ({
	goto: async () => {},
	invalidate: async () => {},
	invalidateAll: async () => {},
	preloadData: async () => {},
	preloadCode: async () => {}
}));

vi.mock('$env/dynamic/private', () => ({ env: process.env }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$env/static/private', () => process.env);
vi.mock('$env/static/public', () => ({}));

// Browser-only libraries that leak into `$lib` barrel exports. These don't
// need real behavior during server-side unit tests - services never render
// toasts.
const toastStub = () => 0;
Object.assign(toastStub, {
	success: () => 0,
	error: () => 0,
	warning: () => 0,
	info: () => 0,
	loading: () => 0,
	message: () => 0,
	promise: () => 0,
	dismiss: () => 0,
	custom: () => 0
});

vi.mock('svelte-sonner', () => ({
	toast: toastStub,
	Toaster: () => null
}));

// The dictionary re-exports a class that uses `$derived` runes at field
// initializers. Plain node (vitest server project) can't evaluate rune
// syntax, and services never render translations anyway, so we stub the
// module with a proxy that returns empty strings for any key.
const dictionaryProxy = new Proxy(
	{},
	{
		get: () => ''
	}
);
vi.mock('$lib/dictionary/dictionary.svelte', () => ({
	Dictionary: class {},
	default: dictionaryProxy
}));
vi.mock('$lib/dictionary', () => ({
	dictionary: dictionaryProxy,
	lang: { actual: 'en_us' }
}));
