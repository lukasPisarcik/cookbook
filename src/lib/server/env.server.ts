import { formatZodErrors, log } from '$lib';
import { z } from 'zod';

/**
 * Server-side environment variables.
 *
 * Add new env vars here so they get validated at boot. Never read
 * `Bun.env` / `process.env` / `$env/*` directly elsewhere — go through
 * `PrivateEnvValue('YOUR_VAR')` so type safety holds.
 *
 */
const PrivateEnvSchema = z.object({
	/** Shared password checked by the /login form action. */
	APP_PASSWORD: z.string().min(1),
	/** Shared secret required by every public Convex function; handed to the client only after login. */
	APP_TOKEN: z.string().min(1)
});

type PrivateEnv = z.infer<typeof PrivateEnvSchema>;

let parsedPrivate: PrivateEnv | null = null;

function getEnv(): PrivateEnv {
	if (parsedPrivate) return parsedPrivate;

	// Bun.env under `bun run dev`; process.env when the built app runs under
	// plain Node (`bun run preview:node` / the e2e flow).
	const envSource = typeof Bun !== 'undefined' ? Bun.env : process.env;
	const { success, data, error: err } = PrivateEnvSchema.safeParse(envSource);
	if (!success) {
		const message = 'Invalid private environment variables';
		const errorId = crypto.randomUUID();
		log.error({ errorId, validationError: formatZodErrors(err) }, message);
		throw new Error(`${message}: ${formatZodErrors(err)}`);
	}
	parsedPrivate = data;
	return parsedPrivate;
}

export function PrivateEnvValue<K extends keyof PrivateEnv>(key: K): PrivateEnv[K] {
	return getEnv()[key];
}
