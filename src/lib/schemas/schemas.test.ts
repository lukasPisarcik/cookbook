/**
 * Schema tests cover behavior that TypeScript and Zod's own test suite
 * don't already guarantee:
 *   - `.default(...)` values that can silently disappear in a refactor.
 *   - Unusual constraints that are easy to "correct" into something subtly
 *     different (e.g. `length(2)` vs `min(2)`).
 *
 * Library behavior (enum membership, UUID format, required-field rejection,
 * shape parsing) is not retested here. Add tests as your domain schemas grow.
 */

import { describe, expect, it } from 'vitest';
import { ToastVariant, ThemeSchema } from './schemas';

describe('ToastVariant', () => {
	it('rejects unknown variants', () => {
		expect(ToastVariant.safeParse('unknown').success).toBe(false);
	});
});

describe('ThemeSchema', () => {
	it('accepts only light or dark', () => {
		expect(ThemeSchema.safeParse('light').success).toBe(true);
		expect(ThemeSchema.safeParse('dark').success).toBe(true);
		expect(ThemeSchema.safeParse('system').success).toBe(false);
	});
});
