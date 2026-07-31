import { describe, expect, it } from 'vitest';
import { consumeLoginAttempt, resetLoginAttempts } from './rateLimit';

/**
 * The limiter keeps module-level state, so every test uses its own key rather
 * than resetting a shared map — that keeps the tests order-independent without
 * exporting a test-only escape hatch.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

describe('consumeLoginAttempt', () => {
	it('allows attempts up to the limit', () => {
		const now = 1_000_000;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			expect(consumeLoginAttempt('under-limit', now).allowed).toBe(true);
		}
	});

	it('blocks the attempt past the limit and reports the wait', () => {
		const now = 1_000_000;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			consumeLoginAttempt('over-limit', now);
		}

		const result = consumeLoginAttempt('over-limit', now);
		expect(result.allowed).toBe(false);
		expect(result.retryAfterSeconds).toBe(WINDOW_MS / 1000);
	});

	it('counts the wait down as the window elapses', () => {
		const now = 1_000_000;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			consumeLoginAttempt('counts-down', now);
		}

		const result = consumeLoginAttempt('counts-down', now + 60_000);
		expect(result.allowed).toBe(false);
		expect(result.retryAfterSeconds).toBe(WINDOW_MS / 1000 - 60);
	});

	it('starts a fresh window once the old one expires', () => {
		const now = 1_000_000;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS + 5; attempt++) {
			consumeLoginAttempt('expires', now);
		}
		expect(consumeLoginAttempt('expires', now).allowed).toBe(false);

		expect(consumeLoginAttempt('expires', now + WINDOW_MS).allowed).toBe(true);
	});

	it('tracks each address independently', () => {
		const now = 1_000_000;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS + 1; attempt++) {
			consumeLoginAttempt('noisy-neighbour', now);
		}

		expect(consumeLoginAttempt('noisy-neighbour', now).allowed).toBe(false);
		expect(consumeLoginAttempt('quiet-neighbour', now).allowed).toBe(true);
	});
});

describe('resetLoginAttempts', () => {
	it('restores the full budget after a successful login', () => {
		const now = 1_000_000;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS + 1; attempt++) {
			consumeLoginAttempt('resets', now);
		}
		expect(consumeLoginAttempt('resets', now).allowed).toBe(false);

		resetLoginAttempts('resets');
		expect(consumeLoginAttempt('resets', now).allowed).toBe(true);
	});
});
