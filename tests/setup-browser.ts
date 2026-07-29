/**
 * Vitest browser setup.
 *
 * Registers SvelteKit virtual module fakes that components rely on when
 * rendered outside of a real SvelteKit request/response (`$app/state`,
 * `$app/navigation`, `$app/paths`). Tests can still override any of
 * these per-spec with `vi.mock(...)` if they need different values.
 */

import { vi } from 'vitest';

vi.mock('$app/navigation', () => ({
	goto: vi.fn(async () => {}),
	invalidate: vi.fn(async () => {}),
	invalidateAll: vi.fn(async () => {}),
	preloadData: vi.fn(async () => {}),
	preloadCode: vi.fn(async () => {})
}));

vi.mock('$app/paths', () => ({
	base: '',
	assets: '',
	resolve: (path: string) => path
}));

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));
