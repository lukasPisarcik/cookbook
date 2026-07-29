# Project overview

Applies to: the whole repo.

## Tech stack

- **Runtime:** Bun (bundler, test runner, package manager)
- **Framework:** SvelteKit with Svelte 5 (runes)
- **Language:** TypeScript with Zod validation
- **Styling:** Tailwind 4 + shadcn-svelte components

Use Bun APIs (`Bun.env`, `Bun.file`) over Node equivalents. Use `bunx` for package binaries (`bunx prettier`, `bunx eslint`), `bun run <script>` for package.json scripts.

## Folder map

```
src/
├── app.css                  # Tailwind 4 theme + shadcn-svelte CSS vars
├── app.d.ts                 # SvelteKit augments
├── hooks.client.ts          # client error handler + store init
├── hooks.server.ts          # server error handler
├── lib/
│   ├── assets/              # logos, favicon
│   ├── components/
│   │   ├── ui/              # shadcn-svelte primitives — DO NOT EDIT
│   │   └── index.ts         # re-exports
│   ├── dictionary/          # i18n strings (only when i18n enabled)
│   ├── errors/              # error helpers (page-level)
│   ├── essentials/          # app shell (Header, SupportTicketForm, AppSidebar)
│   ├── helpers/             # logger, formatZodErrors, toast, string utils
│   ├── schemas/             # Zod schemas (single source of truth)
│   ├── server/
│   │   ├── env.server.ts    # Zod-validated env loader
│   │   ├── services/        # business logic
│   │   └── utils/           # crypto, errors, server-side i18n helpers
│   ├── stores/              # Svelte 5 class-based stores (*.svelte.ts)
│   └── test-utils/          # in-memory factories shared by Bun + Vitest
├── routes/                  # SvelteKit routes
└── ...
```

## Conventions baked in

- **Single source of truth for schemas** — every Zod schema in `src/lib/schemas/schemas.ts`.
- **Single source of truth for env** — every env var in `src/lib/server/env.server.ts`.
- **Service layer** — all server-side business logic in `src/lib/server/services/`. Remote functions are thin wrappers that validate input and delegate.
- **Three-runner tests** — `*.test.ts` runs in Bun (server-side), `*.svelte.test.ts` runs in Vitest browser project (Chromium via Playwright), Cypress runs E2E. See `testing.md`.
