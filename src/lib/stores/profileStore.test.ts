import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$lib', async () => {
	const { z } = await import('zod');
	const { slugify } = await import('../helpers/normalize');
	const ProfileSchema = z.object({
		userId: z.string().min(1).max(40),
		name: z.string().min(1).max(40)
	});
	return {
		ProfileSchema,
		ProfileRosterSchema: z.array(ProfileSchema),
		slugify,
		log: {
			debug: vi.fn(),
			warn: vi.fn(),
			info: vi.fn(),
			error: vi.fn()
		}
	};
});

type ProfileStoreModule = typeof import('./profileStore.svelte');

let importCounter = 0;
async function loadProfileStoreModule(): Promise<ProfileStoreModule> {
	vi.resetModules();
	const specifier = `./profileStore.svelte.ts?isolated=v${++importCounter}` as string;
	return import(specifier) as Promise<ProfileStoreModule>;
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

describe('profileStore', { timeout: 20_000 }, () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, 'localStorage', {
			value: createStorageMock(),
			configurable: true
		});
	});

	it('slugifies the typed name into a diacritic-free userId', async () => {
		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();

		profileStore.set('Lukáš');

		expect(profileStore.userId).toBe('lukas');
		// The display name keeps its diacritics.
		expect(profileStore.name).toBe('Lukáš');
	});

	it('resolves the same userId for the same name typed on another device', async () => {
		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();

		profileStore.set('  lukas  ');
		const first = profileStore.userId;

		profileStore.set('Lukáš');
		expect(profileStore.userId).toBe(first);
	});

	it('round-trips the profile through localStorage without re-prompting', async () => {
		let module = await loadProfileStoreModule();
		module.profileStore.init();
		module.profileStore.set('Zuzka');

		// A fresh load in the same browser (a reload) finds the stored profile.
		module = await loadProfileStoreModule();
		module.profileStore.init();

		expect(module.profileStore.resolved).toBe(true);
		expect(module.profileStore.current).toEqual({ userId: 'zuzka', name: 'Zuzka' });
	});

	it('leaves current null on corrupt JSON instead of throwing', async () => {
		localStorage.setItem('mnamka_profile', '{not json');

		const { profileStore } = await loadProfileStoreModule();
		expect(() => profileStore.init()).not.toThrow();

		expect(profileStore.resolved).toBe(true);
		expect(profileStore.current).toBeNull();
	});

	it('leaves current null on a schema-invalid stored value', async () => {
		localStorage.setItem('mnamka_profile', JSON.stringify({ userId: '', name: 'Nobody' }));

		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();

		expect(profileStore.current).toBeNull();
	});

	it('ignores a corrupt roster but still resolves the active profile', async () => {
		localStorage.setItem('mnamka_profile', JSON.stringify({ userId: 'lukas', name: 'Lukáš' }));
		localStorage.setItem('mnamka_profiles', JSON.stringify({ nope: true }));

		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();

		expect(profileStore.current).toEqual({ userId: 'lukas', name: 'Lukáš' });
		expect(profileStore.known).toEqual([{ userId: 'lukas', name: 'Lukáš' }]);
	});

	it('dedups the roster by userId, most recent first', async () => {
		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();

		profileStore.set('Lukáš');
		profileStore.set('Zuzka');
		// Same userId as the first entry — must not appear twice.
		profileStore.set('lukas');

		expect(profileStore.known.map((entry) => entry.userId)).toEqual(['lukas', 'zuzka']);
	});

	it('restores the roster across a reload', async () => {
		let module = await loadProfileStoreModule();
		module.profileStore.init();
		module.profileStore.set('Lukáš');
		module.profileStore.set('Zuzka');

		module = await loadProfileStoreModule();
		module.profileStore.init();

		expect(module.profileStore.known.map((entry) => entry.name)).toEqual(['Zuzka', 'Lukáš']);
	});

	it('rejects a name that slugifies to nothing', async () => {
		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();

		profileStore.set('!!!');

		expect(profileStore.current).toBeNull();
	});

	it('clear() drops the active profile but keeps the roster', async () => {
		const { profileStore } = await loadProfileStoreModule();
		profileStore.init();
		profileStore.set('Lukáš');

		profileStore.clear();

		expect(profileStore.current).toBeNull();
		expect(profileStore.known.map((entry) => entry.userId)).toEqual(['lukas']);
		expect(localStorage.getItem('mnamka_profile')).toBeNull();
	});
});
