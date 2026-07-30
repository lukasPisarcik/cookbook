import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnvModule(scope: string) {
	const isolatedSpecifier = `./env.server.ts?isolated=${scope}`;
	return import(isolatedSpecifier);
}

describe('env.server', { timeout: 20_000 }, () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('returns parsed values for valid environment', async () => {
		vi.stubEnv('APP_PASSWORD', 'hunter2');
		vi.stubEnv('APP_TOKEN', 'secret-token');
		const envModule = await loadEnvModule('valid');
		expect(envModule.PrivateEnvValue('APP_PASSWORD')).toBe('hunter2');
		expect(envModule.PrivateEnvValue('APP_TOKEN')).toBe('secret-token');
	});

	it('throws a descriptive error for missing required vars', async () => {
		vi.stubEnv('APP_PASSWORD', '');
		vi.stubEnv('APP_TOKEN', '');
		const envModule = await loadEnvModule('invalid');
		expect(() => envModule.PrivateEnvValue('APP_PASSWORD')).toThrow(
			'Invalid private environment variables'
		);
	});
});
