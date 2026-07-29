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
		vi.stubEnv('EXAMPLE_VAR', 'hello');
		const envModule = await loadEnvModule('valid');
		expect(envModule.PrivateEnvValue('EXAMPLE_VAR')).toBe('hello');
	});

	it('throws a descriptive error for missing required vars', async () => {
		vi.stubEnv('EXAMPLE_VAR', '');
		const envModule = await loadEnvModule('invalid');
		expect(() => envModule.PrivateEnvValue('EXAMPLE_VAR')).toThrow(
			'Invalid private environment variables'
		);
	});
});
