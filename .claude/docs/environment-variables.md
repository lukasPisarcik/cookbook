# Environment variables

Applies to: anything that reads env at runtime.

## Rule

All env vars are declared in `src/lib/server/env.server.ts` with Zod validation. Read them via `PrivateEnvValue('VAR_NAME')`. **Never read `Bun.env`, `process.env`, or `$env/*` modules directly elsewhere.**

## Adding a new env var

1. Add the var to `.env.example` with a placeholder value:

   ```
   STRIPE_API_KEY=sk_test_...
   ```

2. Add it to the Zod schema in `src/lib/server/env.server.ts`:

   ```ts
   const PrivateEnvSchema = z.object({
   	EXAMPLE_VAR: z.string().min(1),
   	STRIPE_API_KEY: z.string().regex(/^sk_/, 'must start with sk_')
   });
   ```

3. Use it in code:

   ```ts
   import { PrivateEnvValue } from '$lib/server/env.server';
   const apiKey = PrivateEnvValue('STRIPE_API_KEY');
   ```

4. If running tests that exercise this code, stub the env in `tests/setup-server.ts` or per-test with `vi.stubEnv('STRIPE_API_KEY', '...')`.

5. If deploying via the CI/CD pipeline, add the var to the Azure DevOps variable group `kucharka-vars` and reference it in `cicd/stages/deploy.yml` `appSettings`.

## Why this pattern

- **Type-safe:** `PrivateEnvValue('UNKNOWN')` is a TypeScript error.
- **Boot-time validation:** missing or malformed env vars fail loudly instead of producing `undefined` errors deep in the request path.
- **One place to scan** for what config the app needs.
