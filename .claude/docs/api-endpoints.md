# API endpoints

Applies to: `src/routes/**/+server.ts`, `src/routes/**/+page.server.ts`.

Most server-side data flows in this app go through SvelteKit **remote functions** (see `remote-functions.md`), not REST endpoints. Reach for `+server.ts` only when you need:

- A webhook (external service POSTs to you)
- A non-JSON response (file download, redirect, plain text)
- Public API surface for external consumers

## Pattern

```ts
// src/routes/api/v1/webhook/+server.ts
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { log } from '$lib/helpers/logger';
import * as webhookService from '$lib/server/services/webhook.service';

const Body = z.object({ event: z.string(), payload: z.unknown() });

export const POST: RequestHandler = async ({ request }) => {
	const parsed = Body.safeParse(await request.json());
	if (!parsed.success) {
		return new Response(JSON.stringify({ error: parsed.error }), { status: 400 });
	}

	const result = await webhookService.handle(parsed.data);
	return Response.json(result);
};
```

## Response codes

| Code | Use for                                         |
| ---- | ----------------------------------------------- |
| 200  | Success with body                               |
| 201  | Successful creation (return the created entity) |
| 204  | Success without body                            |
| 400  | Input validation failed                         |
| 401  | Caller is not authenticated                     |
| 403  | Caller is authenticated but not authorized      |
| 404  | Resource doesn't exist                          |
| 409  | Conflict (duplicate, stale state)               |
| 500  | Server error (logged with an error ID)          |

Use `log.error({ errorId, ... })` and surface the `errorId` in the response so users can paste it into support tickets.

## OpenAPI documentation

The OpenAPI spec is documentation only — it describes the public API surface for external consumers but is not used to generate types or code. Keep it at `src/lib/openapi/openapi.yml` and update it by hand whenever a public endpoint changes.
