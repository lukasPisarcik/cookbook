<div align="center">

<img src="src/lib/assets/logo.svg" alt="Kuchárka" width="96" height="96" />

<h1 align="center">Kuchárka</h1>

<p align="center">A personal, mobile-first cookbook — recipes, today's cooking, an aggregated shopping list and a pantry, backed by Convex.</p>

</div>

---

## Stack

- **Runtime**: Bun
- **Framework**: SvelteKit 2 (Svelte 5 with runes)
- **Backend**: Convex (`convex-svelte` live queries, file storage for photos)
- **Styling**: Tailwind CSS 4 + shadcn-svelte primitives
- **Validation**: Zod
- **Logging**: Pino
- **Tests**: Vitest (server + browser) + Cypress (e2e, local-only)
- **Versioning**: Changesets

## The app

Four bottom tabs rebuild the workflow of the `Zoznam receptov.xlsx` workbook:

| Tab            | Route     | What it does                                                                                 |
| -------------- | --------- | -------------------------------------------------------------------------------------------- |
| **Recepty**    | `/`       | Card grid with diacritic-insensitive search, category chips, diet-tag filter and favorites   |
| **Dnes varím** | `/dnes`   | Flagged recipes with kcal-variant + portion-multiplier controls; generates the shopping list |
| **Nákup**      | `/nakup`  | Aggregated list grouped by product type, pantry items auto-excluded (with per-trip override) |
| **Špajza**     | `/spajza` | Persistent "mám doma" list with autocomplete over all known ingredient names                 |

The whole app sits behind a shared-password gate (`/login`); every public
Convex function additionally requires the `APP_TOKEN` shared secret.

## Setup

```bash
bun install
bunx convex dev --once     # provisions a dev deployment, writes .env.local
cp .env.example .env       # set APP_PASSWORD + APP_TOKEN
bunx convex env set APP_TOKEN <same-value-as-in-.env>
bun run dev
```

App will start on http://localhost:5173.

## Seeding the data

The recipe corpus is a one-time extraction of 95 source documents (see
`tools/extract/`); the validated output is committed under `seed/`, so
importing never re-reads the PDFs:

```bash
bun tools/seed/import.ts             # validate, merge variants, upload photos, upsert
bun tools/seed/import.ts --dry-run   # validation + report only
```

The import is idempotent (recipes upsert by slug) and prints per-source
counts plus an anomaly report (missing photos/macros, suspicious kcal).

To regenerate the seed from the source folder (`~/Desktop/Všetky recepty`):

```bash
bun tools/extract/parse-xlsx.ts        # workbook → seed/blueprint.json
bash tools/extract/extract-images.sh   # photos → seed/images/*.webp (needs poppler + webp)
# LLM document extraction produces seed/recipes/**/*.json (see plan)
```

## Conventions

This project follows the Clinigma SPA template conventions. See:

- `CLAUDE.md` — agent orientation
- `.claude/docs/` — topic-by-topic reference (schemas, services, testing, etc.)

Key rules:

- All Zod schemas live in `src/lib/schemas/schemas.ts`
- All env vars are declared in `src/lib/server/env.server.ts` (Zod-validated)
- All styling is Tailwind utility classes — no `<style>` blocks or standalone CSS
- Test files: `*.test.ts` (server, Vitest node) or `*.svelte.test.ts` (client, Vitest browser)

## Commands

| Command             | What it does                           |
| ------------------- | -------------------------------------- |
| `bun run dev`       | Start dev server                       |
| `bunx convex dev`   | Run Convex dev deployment (watch mode) |
| `bun run build`     | Production build                       |
| `bun run check`     | TypeScript + Svelte type check         |
| `bun run lint`      | Prettier + ESLint                      |
| `bun run test:unit` | Vitest (server + client projects)      |
| `bun run e2e`       | Cypress smoke flow (needs Convex dev)  |
| `bun changeset`     | Add a changeset for your change        |
