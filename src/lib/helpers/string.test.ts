import { describe, expect, it } from 'vitest';
import { getInitials } from './string';

describe('getInitials', () => {
	it.each([
		['John Doe', 'JD'],
		['Alice', 'A'],
		['John Michael Doe', 'JM'],
		['a b c d', 'AB'],
		['lowercase name', 'LN'],
		['single', 'S']
	])('getInitials(%p) returns %p', (input, expected) => {
		expect(getInitials(input)).toBe(expected);
	});

	it('returns an empty string for an empty input', () => {
		expect(getInitials('')).toBe('');
	});

	it('caps the result at 2 characters even for long names', () => {
		expect(getInitials('Anna Bertha Cathy Diane Elinor')).toBe('AB');
	});
});
