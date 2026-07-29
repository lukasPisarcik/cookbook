import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$lib', async () => {
	const { z } = await import('zod');
	return {
		ThemeSchema: z.enum(['light', 'dark']),
		log: {
			debug: vi.fn(),
			warn: vi.fn(),
			info: vi.fn(),
			error: vi.fn()
		}
	};
});

type ThemeStoreModule = typeof import('./themeStore.svelte');

let importCounter = 0;
async function loadThemeStoreModule(): Promise<ThemeStoreModule> {
	vi.resetModules();
	const specifier = `./themeStore.svelte.ts?isolated=v${++importCounter}` as string;
	return import(specifier) as Promise<ThemeStoreModule>;
}

function createStorageMock() {
	const storage = new Map<string, string>();
	return {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => {
			storage.set(key, value);
		},
		clear: () => storage.clear()
	};
}

describe('themeStore', { timeout: 20_000 }, () => {
	let mediaListeners: Array<() => void> = [];

	beforeEach(() => {
		mediaListeners = [];
		const storage = createStorageMock();
		Object.defineProperty(globalThis, 'localStorage', {
			value: storage,
			configurable: true
		});
		Object.defineProperty(globalThis, 'document', {
			value: { documentElement: { dataset: { theme: '' } } },
			configurable: true
		});
		Object.defineProperty(globalThis, 'window', {
			value: {
				matchMedia: vi.fn((_query: string) => ({
					matches: false,
					addEventListener: (_event: string, listener: () => void) => {
						mediaListeners.push(listener);
					}
				}))
			},
			configurable: true
		});
	});

	it('initializes from system preference when there is no stored value', async () => {
		const { themeStore } = await loadThemeStoreModule();
		themeStore.init();

		expect(themeStore.current).toBe('light');
		expect(document.documentElement.dataset.theme).toBe('light');
	});

	it('uses valid stored theme and ignores invalid stored theme', async () => {
		localStorage.setItem('theme', 'dark');
		let module = await loadThemeStoreModule();
		module.themeStore.init();
		expect(module.themeStore.current).toBe('dark');

		localStorage.setItem('theme', 'invalid-theme');
		module = await loadThemeStoreModule();
		module.themeStore.init();
		expect(module.themeStore.current).toBe('light');
	});

	it('set and toggle persist theme and apply html dataset', async () => {
		const { themeStore } = await loadThemeStoreModule();
		themeStore.init();

		themeStore.set('dark');
		expect(themeStore.current).toBe('dark');
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(localStorage.getItem('theme')).toBe('dark');

		themeStore.toggle();
		expect(themeStore.current).toBe('light');
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(localStorage.getItem('theme')).toBe('light');
	});

	it('adopts system theme changes only before user sets preference', async () => {
		const { themeStore } = await loadThemeStoreModule();
		themeStore.init();

		Object.defineProperty(globalThis, 'window', {
			value: {
				matchMedia: vi.fn((_query: string) => ({
					matches: true,
					addEventListener: (_event: string, listener: () => void) => {
						mediaListeners.push(listener);
					}
				}))
			},
			configurable: true
		});
		if (mediaListeners[0]) {
			mediaListeners[0]();
		}
		expect(themeStore.current).toBe('dark');

		themeStore.set('dark');
		Object.defineProperty(globalThis, 'window', {
			value: {
				matchMedia: vi.fn((_query: string) => ({
					matches: false,
					addEventListener: (_event: string, listener: () => void) => {
						mediaListeners.push(listener);
					}
				}))
			},
			configurable: true
		});
		if (mediaListeners[0]) {
			mediaListeners[0]();
		}
		expect(themeStore.current).toBe('dark');
	});
});
