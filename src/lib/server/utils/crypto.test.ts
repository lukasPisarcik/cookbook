import { describe, expect, it } from 'vitest';
import { hexToBuffer } from './crypto';

describe('hexToBuffer', () => {
	it('converts a valid hex string into bytes', () => {
		const bytes = hexToBuffer('deadbeef');
		expect(Array.from(bytes)).toEqual([222, 173, 190, 239]);
	});

	it('returns an empty array for empty input', () => {
		const bytes = hexToBuffer('');
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(0);
	});

	it('parses case-insensitive hex characters', () => {
		const bytes = hexToBuffer('AaFf00');
		expect(Array.from(bytes)).toEqual([170, 255, 0]);
	});
});
