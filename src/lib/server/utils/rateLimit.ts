/**
 * Fixed-window rate limiting for the shared-password login form.
 *
 * A single memorable password on a public URL is only as strong as the number
 * of guesses an attacker gets, so the form caps attempts per client address.
 *
 * State is in-memory and therefore per-instance: on Vercel a burst spread
 * across cold starts gets a fresh budget per instance, and a redeploy clears
 * every window. That is a speed bump, not a wall — it is the right trade for a
 * two-person app that would otherwise need a shared store, and it still turns
 * an unbounded online guessing attack into a slow one.
 */

/** Attempts allowed per address before the window closes. */
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Cap on tracked addresses. Rotating source addresses would otherwise grow the
 * map without bound; expired windows are swept before the cap is enforced.
 */
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
	allowed: boolean;
	/** Seconds until the window resets. Zero when the attempt was allowed. */
	retryAfterSeconds: number;
}

interface AttemptWindow {
	count: number;
	resetAt: number;
}

const windows = new Map<string, AttemptWindow>();

function sweepExpired(now: number): void {
	for (const [key, window] of windows) {
		if (window.resetAt <= now) windows.delete(key);
	}
}

/**
 * Count one login attempt against `key` (the client address) and report
 * whether it may proceed. `now` is injectable so the tests need no clock.
 */
export function consumeLoginAttempt(key: string, now: number = Date.now()): RateLimitResult {
	const existing = windows.get(key);

	// No window, or the previous one has expired — start a fresh one.
	if (!existing || existing.resetAt <= now) {
		if (windows.size >= MAX_TRACKED_KEYS) sweepExpired(now);
		windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true, retryAfterSeconds: 0 };
	}

	existing.count += 1;
	if (existing.count > MAX_ATTEMPTS) {
		return {
			allowed: false,
			retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000)
		};
	}
	return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Drop the window for `key`. Called after a successful login so a correct
 * password immediately restores the full budget for that address.
 */
export function resetLoginAttempts(key: string): void {
	windows.delete(key);
}
