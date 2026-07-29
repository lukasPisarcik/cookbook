import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { formatZodErrors } from './formatZodErrors';

describe('formatZodErrors', () => {
	it('formats a single field error', () => {
		const schema = z.object({ email: z.string() });
		const result = schema.safeParse({ email: 123 });
		expect(result.success).toBe(false);

		const formatted = formatZodErrors(result.error!);
		expect(formatted).toHaveLength(1);
		expect(formatted[0].path).toBe('email');
		expect(typeof formatted[0].message).toBe('string');
	});

	it('joins nested paths with dots', () => {
		const schema = z.object({
			user: z.object({
				profile: z.object({
					name: z.string()
				})
			})
		});
		const result = schema.safeParse({ user: { profile: {} } });
		const formatted = formatZodErrors(result.error!);

		expect(formatted[0].path).toBe('user.profile.name');
	});

	it('uses "(root)" for root-level errors with empty path', () => {
		const error = new z.ZodError([
			{ code: 'custom', path: [], message: 'Invalid object', input: null }
		]);
		const formatted = formatZodErrors(error);
		expect(formatted[0].path).toBe('(root)');
	});

	it('includes expected/received for type mismatches when strings', () => {
		const schema = z.object({ count: z.number() });
		const result = schema.safeParse({ count: 'nope' });

		const formatted = formatZodErrors(result.error!);
		expect(formatted[0].expected).toBe('number');
	});

	it('includes received when an issue provides it as a string', () => {
		const error = new z.ZodError([
			{
				code: 'invalid_type',
				path: ['count'],
				message: 'Invalid input: expected number, received string',
				expected: 'number',
				received: 'string',
				input: 'nope'
			} as unknown as z.core.$ZodIssue
		]);

		const formatted = formatZodErrors(error);
		expect(formatted[0].received).toBe('string');
	});

	it('returns one entry per issue', () => {
		const schema = z.object({ a: z.string(), b: z.number() });
		const result = schema.safeParse({});
		const formatted = formatZodErrors(result.error!);

		expect(formatted.length).toBeGreaterThanOrEqual(2);
		const paths = formatted.map((f) => f.path).sort();
		expect(paths).toEqual(['a', 'b']);
	});
});
