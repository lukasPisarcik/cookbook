<div align="center">

<h1 align="center">Kuchárka</h1>

<p align="center">A personal cookbook built with SvelteKit + Bun + Tailwind 4 + shadcn-svelte.</p>

</div>

---

## Stack

- **Runtime**: Bun
- **Framework**: SvelteKit 2 (Svelte 5 with runes)
- **Styling**: Tailwind CSS 4 + shadcn-svelte primitives
- **Validation**: Zod
- **Logging**: Pino
- **Tests**: Bun (server) + Vitest browser (components) + Cypress (e2e)
- **Versioning**: Changesets

## Setup

```bash
bun install
cp .env.example .env   # populate values, see env.server.ts for the schema
bun run dev
```

App will start on http://localhost:5173.

## Conventions

This project follows Clinigma's standard conventions. See:

- `CLAUDE.md` — agent orientation
- `.claude/docs/` — topic-by-topic reference (schemas, services, testing, etc.)

Key rules:

- All Zod schemas live in `src/lib/schemas/schemas.ts`
- All env vars are declared in `src/lib/server/env.server.ts` (Zod-validated)
- Server logic goes in `src/lib/server/services/`, called from remote functions
- Test files: `*.test.ts` (server, Bun) or `*.svelte.test.ts` (client, Vitest browser)

## Commands

| Command                | What it does                      |
| ---------------------- | --------------------------------- |
| `bun run dev`          | Start dev server                  |
| `bun run build`        | Production build                  |
| `bun run check`        | TypeScript + Svelte type check    |
| `bun run lint`         | Prettier + ESLint                 |
| `bun run test:unit`    | Vitest (server + client projects) |
| `bun run cypress:open` | Open Cypress runner               |
| `bun changeset`        | Add a changeset for your change   |

## CI/CD

Azure DevOps pipeline lives in `cicd/`. Stages: build → test → (security-scan) → deliver → deploy.

Variable group: `kucharka-vars` (configure in Azure DevOps).
Container registry: `kucharkacontainer.azurecr.io`.
