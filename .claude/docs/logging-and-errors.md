# Logging and errors

Applies to: any code that logs, throws, or handles errors.

## Logger

Use `log` from `$lib/helpers/logger` (Pino under the hood). Prefer structured logs — pass an object as the first argument and a human message as the second:

```ts
import { log } from '$lib/helpers/logger';

log.info({ patientId, action: 'create' }, 'Patient created');
log.warn({ inputType: typeof input }, 'Unexpected input shape');
log.error({ errorId, err: error }, 'Service call failed');
```

## Error IDs

Every error response surfaced to a user should include a UUID `errorId` so they can paste it into a support ticket:

```ts
const errorId = crypto.randomUUID();
log.error({ errorId, err }, 'Failed to create patient');
return new Response(JSON.stringify({ error: { id: errorId, code: 'PATIENT_CREATE_FAILED' } }), {
	status: 500
});
```

The error page in `src/routes/+error.svelte` reads `error.id` and renders it under the support form, so users can copy-paste it without screenshots.

## Don't

- Don't log secrets — env values, JWTs, request bodies that may contain PII. The logger has no automatic redaction.
- Don't `console.log` — Pino respects log levels and structured output; `console.log` doesn't.
- Don't swallow errors silently. If you catch one, decide: rethrow, transform to a domain error, or log + return a fallback.

## Throwing inside services

Throw plain `Error` (or a subclass) from services. Higher layers (remote functions, route handlers) catch and translate into HTTP responses. Don't throw `SvelteKit error()` from a service — that couples it to SvelteKit's runtime.

```ts
// src/lib/server/services/patient.service.ts
export async function getPatient(id: string): Promise<Patient> {
	const found = await db.patient.findUnique({ where: { id } });
	if (!found) throw new Error(`Patient ${id} not found`);
	return found;
}
```
