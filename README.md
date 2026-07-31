<div align="center">

<img src="src/lib/assets/logo.svg" alt="Mňamka" width="96" height="96" />

<h1 align="center">Mňamka</h1>

<p align="center">A personal, mobile-first cookbook — recipes, today's cooking, an aggregated shopping list and a pantry, backed by Convex. Shared by two kitchens, with per-profile personal state.</p>

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
| **Špajza**     | `/spajza` | Tile grid of "mám doma" — tap to remove, search or tap a "Časté" tile to add                 |

The whole app sits behind a shared-password gate (`/login`); every public
Convex function additionally requires the `APP_TOKEN` shared secret.

### Profiles

Past the password, a first-run "Kto si?" prompt asks for a name and stores
`{ userId: slugify(name), name }` in `localStorage`. Favourites, "Dnes varím"
selections, špajza and shopping list are all scoped to that `userId`; the recipe
corpus itself stays shared and read-only. Typing the same name on another device
resolves to the same profile, and the top-bar avatar switches between them.

> **Trust boundary — read this before sharing the URL.** A profile is a
> _preference, not a credential_. The shared password is the only real boundary:
> the client sends `userId` to Convex unverified, so anyone past the password can
> read or write any profile by editing `localStorage`. That is acceptable for two
> siblings sharing a secret; it is **not** acceptable if the URL is shared
> further. Adding a second person is safe; adding a stranger is not.

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
bun tools/seed/import.ts --user zuzka   # own the starter pantry / pre-flagged recipes
```

The import is idempotent (recipes upsert by slug) and prints per-source
counts plus an anomaly report (missing photos/macros, suspicious kcal).
`--user` (default `lukas`) decides which profile gets the blueprint's starter
pantry and its pre-flagged "Dnes varím" recipes — both are per-profile state now.

To regenerate the seed from the source folder (`~/Desktop/Všetky recepty`):

```bash
bun tools/extract/parse-xlsx.ts        # workbook → seed/blueprint.json
bash tools/extract/extract-images.sh   # photos → seed/images/*.webp (needs poppler + webp)
# LLM document extraction produces seed/recipes/**/*.json (see plan)
```

## Migrating an existing deployment to profiles

A deployment that predates profiles has favourites and "Dnes varím" flags on the
shared recipe document, and owner-less pantry/shopping rows. `convex/schema.ts`
is already at its final shape, so a **fresh** deployment needs nothing. An
existing one needs the one-shot migration, which is idempotent:

```bash
bunx convex run migrations:adoptLegacyState '{"userId":"lukas"}'
```

It copies the legacy flags into `recipeState`, stamps `userId` on every pantry
and shopping row, and strips the legacy fields. It is deliberately **not** wired
into a build step — a data-destructive mutation should not run on every deploy.

> If you are staging this migration onto a deployment that still holds legacy
> rows, Convex validates the schema against existing documents on deploy: widen
> first (every new field `v.optional`), run the migration, then tighten. Dropping
> `isFavorite` before the migration has stripped it fails the deploy.

## Deploying to Vercel

`svelte.config.js` picks the adapter off Vercel's own `VERCEL` env var:
`@sveltejs/adapter-vercel` on Vercel, `@sveltejs/adapter-node` locally — so
`bun run e2e`, which serves `node build/index.js`, keeps working.

```bash
# 1. Provision the Convex production deployment (prints its URL)
bunx convex deploy

# 2. APP_TOKEN is NOT carried over from dev — set it on prod explicitly
bunx convex env set APP_TOKEN <value> --prod

# 3. Validate the corpus first — --dry-run writes nothing and needs no
#    deployment, so it takes no env at all
bun tools/seed/import.ts --dry-run

# 4. Seed production (777 seed files → 635 recipes, ~580 photo uploads —
#    expect several minutes; just re-run on failure, it is idempotent)
PUBLIC_CONVEX_URL=<prod-url> APP_TOKEN=$(bunx convex env get APP_TOKEN --prod) \
  bun tools/seed/import.ts --user lukas
```

> **Pass `PUBLIC_CONVEX_URL`, not `CONVEX_URL`.** The importer reads
> `Bun.env.PUBLIC_CONVEX_URL` (`tools/seed/import.ts`), and Bun auto-loads
> `.env.local`, so an unset or misnamed override silently seeds the **dev**
> deployment instead of prod — with no error. `APP_TOKEN` must likewise be the
> value set on prod in step 2, not the dev one from `.env`; reading it back with
> `convex env get` keeps the two in sync by construction.
>
> The script prints its fuzzy-title-match list and then goes **silent for
> several minutes** while it uploads photos one at a time — there is no
> per-image progress. The next line you see is `✓ images: N available`. That
> pause is not a hang. Uploads are cached per deployment in
> `.extract-cache/image-uploads.json`, so a re-run resumes rather than
> re-uploading. Don't run two importers at once — they race on that cache file.

Then, in the Vercel project settings, set these for **Production and Preview**
and deploy:

| Variable            | Value                                     |
| ------------------- | ----------------------------------------- |
| `PUBLIC_CONVEX_URL` | the production deployment URL from step 1 |
| `APP_PASSWORD`      | the shared password                       |
| `APP_TOKEN`         | must match what step 2 set on Convex prod |

No new environment variable is introduced — the same three carry over, so
`env.server.ts` is untouched. The session cookie already sets `secure` from
`url.protocol === 'https:'`, so it works on Vercel and on a LAN dev box without
changes.

Verify on a phone afterwards: login → "Kto si?" → recipes load → favourite
persists across a reload.

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
