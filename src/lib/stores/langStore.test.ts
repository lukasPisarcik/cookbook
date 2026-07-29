import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$lib/helpers/logger', () => ({
	log: {
		debug: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		error: vi.fn()
	}
}));

type LangStoreModule = typeof import('./langStore.svelte');

let importCounter = 0;
async function loadLangStoreModule(): Promise<LangStoreModule> {
	vi.resetModules();
	const specifier = `./langStore.svelte.ts?isolated=v${++importCounter}` as string;
	return import(specifier) as Promise<LangStoreModule>;
}

function createStorageMock() {
	const storage = new Map<string, string>();
	return {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => {
			storage.set(key, value);
		},
		removeItem: (key: string) => {
			storage.delete(key);
		},
		clear: () => storage.clear()
	};
}

describe('langStore', { timeout: 20_000 }, () => {
	beforeEach(() => {
		const storage = createStorageMock();
		Object.defineProperty(globalThis, 'localStorage', {
			value: storage,
			configurable: true
		});
		Object.defineProperty(globalThis, 'navigator', {
			value: { language: 'en-US' },
			configurable: true
		});
		Object.defineProperty(globalThis, 'document', {
			value: { documentElement: { lang: '', dir: '' } },
			configurable: true
		});
	});

	it('falls back to default locale when browser language is unsupported', async () => {
		Object.defineProperty(globalThis, 'navigator', {
			value: { language: 'xx-XX' },
			configurable: true
		});
		const { langStore } = await loadLangStoreModule();

		langStore.init();

		expect(langStore.locale).toBe('en_us');
	});

	it('persists the chosen locale to localStorage on set', async () => {
		const { langStore } = await loadLangStoreModule();
		langStore.set('en_us');
		expect(localStorage.getItem('lang.locale')).toBe('en_us');
	});
});
