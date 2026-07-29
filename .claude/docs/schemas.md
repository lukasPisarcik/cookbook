# Schemas (Zod)

Applies to: `src/lib/schemas/schemas.ts` — and any place tempted to define a TypeScript interface or Zod schema.

## Rule

Every Zod schema and shared TypeScript type lives in `src/lib/schemas/schemas.ts`. **No inline interfaces, no per-feature `types.ts` files, no schemas next to remote functions.**

## Pattern

Define both the schema and the inferred type with the same name. Export both:

```ts
export const Patient = z.object({
	id: z.uuid(),
	name: z.string().min(1),
	birthYear: z.number().int().min(1900)
});
export type Patient = z.infer<typeof Patient>;
```

This lets consumers `import { Patient } from '$lib/schemas'` and use either:

```ts
const parsed = Patient.parse(unknownData);   // schema
function greet(p: Patient) { ... }            // type
```

## Why one file

- One pull request for adding a domain concept; no hunting across the repo.
- TypeScript catches divergence between schemas and types automatically (since the type is `z.infer<schema>`).
- Refactoring is local — rename a field once.

## When the file gets large

Once `schemas.ts` passes ~1000 lines, split into topic files like `schemas/recordings.ts` and re-export from `schemas/index.ts`. Don't split prematurely.
