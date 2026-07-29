# Zod validation

Applies to: every place we accept untrusted input (request bodies, env, JSON parsing, localStorage values).

## Use `safeParse` at boundaries

At an external boundary (HTTP request, webhook payload, env, persisted state from another version of the app), use `safeParse` so failures surface as data, not exceptions:

```ts
const parsed = Patient.safeParse(unknownData);
if (!parsed.success) {
	return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 });
}
const patient = parsed.data;
```

Inside trusted code that already knows the shape, `parse` is fine — the throw is a bug detector.

## Common patterns

| Need                  | Pattern                               |
| --------------------- | ------------------------------------- |
| Optional with default | `z.string().default('')`              |
| Branded ID            | `z.uuid().brand<'PatientId'>()`       |
| Union of literals     | `z.enum(['active', 'paused'])`        |
| One-of (object union) | `z.discriminatedUnion('kind', [...])` |
| Strip unknown fields  | `z.object({...}).strip()` (default)   |
| Reject unknown fields | `z.object({...}).strict()`            |
| Coerce numeric env    | `z.coerce.number().int().positive()`  |

## Format errors for users

Use `formatZodErrors` from `$lib/helpers` to turn a `ZodError` into a flat object suitable for logging or returning to the client:

```ts
import { formatZodErrors } from '$lib/helpers';

if (!parsed.success) {
	log.warn({ validationError: formatZodErrors(parsed.error) }, 'Invalid input');
	return Response.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
}
```

## Don't

- Don't define schemas inline next to remote functions. They go in `src/lib/schemas/schemas.ts`.
- Don't use Zod just to type-cast — use `as` for that. Zod's job is runtime validation.
