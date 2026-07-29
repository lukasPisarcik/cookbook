/**
 * Mock Data Factories (In-Memory)
 *
 * Factories create in-memory test data matching the app's schema types.
 * Shared between Bun test (server) and Vitest (component) runners.
 *
 * Add factories here as your domain schemas grow. The pattern is:
 *
 *     export function createMockX(overrides: Partial<X> = {}): X {
 *         return { ...sensibleDefaults, ...overrides };
 *     }
 *
 * Importing factories from `$lib/test-utils` in tests keeps them in sync
 * with schema changes (TS will complain when fields drift).
 */
export {};
