# Server services

Applies to: `src/lib/server/services/`.

## Rule

All server-side business logic lives in `src/lib/server/services/`. Remote functions, route handlers, and webhooks are thin entry points that validate input, call the service, and shape the response — they don't contain business logic themselves.

## Pattern

```ts
// src/lib/server/services/patient.service.ts
import { log } from '$lib/helpers/logger';
import type { Patient } from '$lib/schemas';

export async function createPatient(input: { name: string; birthYear: number }): Promise<Patient> {
	log.info({ name: input.name }, 'Creating patient');
	// ... call DB / SDK / external API ...
	return { id: crypto.randomUUID(), ...input };
}
```

```ts
// src/lib/remote/patient.remote.ts
import { command } from '$app/server';
import { Patient } from '$lib/schemas';
import * as patientService from '$lib/server/services/patient.service';

export const createPatient = command(Patient.omit({ id: true }), patientService.createPatient);
```

## Why a service layer

- Remote functions / endpoints / webhooks can all share the same logic without duplication.
- Services are easy to unit-test in Node (Bun) — no SvelteKit bootstrap, no HTTP layer.
- If you ever need a CLI, a job runner, or a different transport, the service is reusable.

## Logging

Each service entry point should log enough context to trace a request without leaking secrets. Use `log.info({ ...context }, 'human message')` from `$lib/helpers/logger`.
