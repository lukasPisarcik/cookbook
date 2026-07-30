import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('session tokens', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.stubEnv('APP_PASSWORD', 'correct horse battery staple');
		vi.stubEnv('APP_TOKEN', 'test-token');
	});

	it('creates a stable hex token for the same password', async () => {
		const session = await import('./session');
		const a = await session.createSessionToken();
		const b = await session.createSessionToken();
		expect(a).toBe(b);
		expect(a).toMatch(/^[0-9a-f]{64}$/);
	});

	it('accepts the issued token', async () => {
		const session = await import('./session');
		const token = await session.createSessionToken();
		await expect(session.isValidSessionToken(token)).resolves.toBe(true);
	});

	it('rejects missing, malformed and forged tokens', async () => {
		const session = await import('./session');
		const token = await session.createSessionToken();
		await expect(session.isValidSessionToken(undefined)).resolves.toBe(false);
		await expect(session.isValidSessionToken('')).resolves.toBe(false);
		await expect(session.isValidSessionToken('deadbeef')).resolves.toBe(false);
		const forged = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');
		await expect(session.isValidSessionToken(forged)).resolves.toBe(false);
	});
});
