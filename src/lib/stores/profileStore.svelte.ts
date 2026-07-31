import { browser } from '$app/environment';
import { ProfileSchema, ProfileRosterSchema, type Profile, log, slugify } from '$lib';

const PROFILE_KEY = 'mnamka_profile';
const ROSTER_KEY = 'mnamka_profiles';

/**
 * The active profile — the key every personal Convex query is scoped by.
 *
 * A profile is a preference, not a credential: the shared password is the only
 * boundary and Convex trusts the `userId` the client sends. It exists so two
 * people sharing one deployment keep separate favourites, „Dnes varím"
 * selections, špajza and shopping lists.
 *
 * `resolved` is false until `init()` has run in the browser. Queries pass
 * `'skip'` until then, so nothing is ever fetched for an empty or wrong user.
 */
class ProfileStoreClass {
	current = $state<Profile | null>(null);
	/** Previously used profiles on this device — offered by the switcher. */
	known = $state<Profile[]>([]);
	/** False until `init()` has run in the browser. */
	resolved = $state(false);

	get userId(): string | null {
		return this.current?.userId ?? null;
	}

	get name(): string | null {
		return this.current?.name ?? null;
	}

	init(): void {
		if (!browser || this.resolved) return;

		const stored = this.readJson(PROFILE_KEY);
		if (stored !== undefined) {
			const { success, data, error: err } = ProfileSchema.safeParse(stored);
			if (success) {
				this.current = data;
				log.debug({ userId: data.userId }, 'Profile loaded from localStorage');
			} else {
				log.warn({ validationError: err }, 'Stored profile is invalid, prompting again');
			}
		}

		this.known = this.readRoster();
		this.resolved = true;
	}

	/** Adopt (or create) the profile for `name`; no-op when the name is unusable. */
	set(name: string): void {
		const userId = slugify(name);
		const candidate = { userId, name: name.trim() };
		const { success, data, error: err } = ProfileSchema.safeParse(candidate);
		if (!success) {
			log.warn({ validationError: err }, 'Invalid profile name');
			return;
		}

		this.current = data;
		this.known = [data, ...this.known.filter((entry) => entry.userId !== data.userId)];
		this.persist();
		log.debug({ userId: data.userId }, 'Profile set');
	}

	/** Forget the active profile (back to the „Kto si?" prompt); the roster stays. */
	clear(): void {
		this.current = null;
		if (browser) localStorage.removeItem(PROFILE_KEY);
	}

	private persist(): void {
		if (!browser || !this.current) return;
		localStorage.setItem(PROFILE_KEY, JSON.stringify(this.current));
		localStorage.setItem(ROSTER_KEY, JSON.stringify(this.known));
	}

	private readRoster(): Profile[] {
		const stored = this.readJson(ROSTER_KEY);
		if (stored === undefined) return this.current ? [this.current] : [];

		const { success, data, error: err } = ProfileRosterSchema.safeParse(stored);
		if (!success) {
			log.warn({ validationError: err }, 'Stored profile roster is invalid, ignoring it');
			return this.current ? [this.current] : [];
		}

		// Dedup by userId, active profile first. A roster is a handful of names,
		// so a linear scan beats reaching for a Set here.
		const roster: Profile[] = [];
		for (const entry of [...(this.current ? [this.current] : []), ...data]) {
			if (roster.some((existing) => existing.userId === entry.userId)) continue;
			roster.push(entry);
		}
		return roster;
	}

	/**
	 * `JSON.parse` throws on corrupt data — one bad key must not stop the app
	 * from booting, so a parse failure reads as „no stored value".
	 */
	private readJson(key: string): unknown {
		const raw = localStorage.getItem(key);
		if (raw === null) return undefined;
		try {
			return JSON.parse(raw);
		} catch (error) {
			log.warn({ key, error: String(error) }, 'Stored value is not valid JSON, ignoring it');
			return undefined;
		}
	}
}

export const profileStore = new ProfileStoreClass();
