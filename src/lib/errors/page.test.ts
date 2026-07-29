import { describe, expect, it } from 'vitest';
import { getErrorCategory, getErrorMetadata, getStatusText } from './page';

describe('getErrorCategory', () => {
	it.each([
		[401, 'auth'],
		[403, 'forbidden'],
		[404, 'not_found'],
		[400, 'validation'],
		[422, 'validation'],
		[500, 'server'],
		[502, 'server'],
		[300, 'unknown']
	] as const)('maps status %i to category %s', (status, expected) => {
		expect(getErrorCategory(status)).toBe(expected);
	});
});

describe('getErrorMetadata', () => {
	it('returns the auth metadata for 401', () => {
		const meta = getErrorMetadata(401);
		expect(meta.category).toBe('auth');
		expect(meta.showRetry).toBe(true);
		expect(meta.showHome).toBe(true);
		expect(meta.showSupport).toBe(true);
		expect(meta.titleKey).toBe('errorPageAuthTitle');
	});

	it('hides retry for a 403 forbidden', () => {
		const meta = getErrorMetadata(403);
		expect(meta.showRetry).toBe(false);
	});

	it('hides retry and support for a 404 not found', () => {
		const meta = getErrorMetadata(404);
		expect(meta.showRetry).toBe(false);
		expect(meta.showSupport).toBe(false);
	});

	it('returns the server metadata for 500+', () => {
		const meta = getErrorMetadata(503);
		expect(meta.category).toBe('server');
		expect(meta.showRetry).toBe(true);
	});

	it('returns validation metadata for other 4xx statuses', () => {
		const meta = getErrorMetadata(422);
		expect(meta.category).toBe('validation');
		expect(meta.titleKey).toBe('errorPageValidationTitle');
		expect(meta.showRetry).toBe(true);
	});

	it('returns unknown metadata for non-4xx/5xx statuses', () => {
		const meta = getErrorMetadata(302);
		expect(meta.category).toBe('unknown');
		expect(meta.titleKey).toBe('errorPageUnknownTitle');
		expect(meta.showSupport).toBe(true);
	});
});

describe('getStatusText', () => {
	it.each([
		[400, 'Bad Request'],
		[401, 'Unauthorized'],
		[403, 'Forbidden'],
		[404, 'Not Found'],
		[500, 'Internal Server Error']
	])('maps %i to %s', (status, expected) => {
		expect(getStatusText(status)).toBe(expected);
	});

	it('falls back to "Error" for unknown status codes', () => {
		expect(getStatusText(418)).toBe('Error');
	});
});
