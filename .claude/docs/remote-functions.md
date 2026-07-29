# Remote functions

Applies to: `src/lib/remote/*.remote.ts`.

SvelteKit remote functions are the default way to call server logic from the client — preferred over manual `fetch` + `+server.ts` round-trips for typed RPC.

## Pattern

A remote function file is a thin wrapper: schema validation → service call. Business logic stays in `src/lib/server/services/`.

```ts
// src/lib/remote/patient.remote.ts
import { command, query, getRequestEvent } from '$app/server';
import { Patient, EmptyInput } from '$lib/schemas';
import * as patientService from '$lib/server/services/patient.service';

const NewPatient = Patient.omit({ id: true });

export const createPatient = command(NewPatient, async (input) => {
	return patientService.createPatient(input);
});

export const listPatients = query(EmptyInput, async () => {
	return patientService.listAll();
});
```

Client side:

```ts
import { createPatient, listPatients } from '$lib/remote/patient.remote';

const patient = await createPatient({ name: 'Jane', birthYear: 1990 });
const all = await listPatients({});
```

## When to use what

| API       | Use for                                       |
| --------- | --------------------------------------------- |
| `query`   | Read-only, idempotent, side-effect free       |
| `command` | Mutations, side-effecting                     |
| `form`    | Form submissions with progressive enhancement |

## Auth / session checks

If the action needs the current user, get the request event inside the handler and call your auth helper:

```ts
import { getRequestEvent } from '$app/server';

export const protectedAction = command(NewPatient, async (input) => {
	const event = getRequestEvent();
	const session = await getSession(event); // your auth helper
	if (!session) throw new Error('Unauthorized');
	return patientService.createPatient(input);
});
```

Auth scaffolding is intentionally not included by default — see `authentication.md` for the recipe to add it.

## Don't

- Don't put business logic in the remote function — delegate to a service.
- Don't return raw DB rows; shape them through a Zod schema first.
