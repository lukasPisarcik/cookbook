<div align="center">

<img src="src/lib/assets/logo.svg" alt="" width="96" height="96" />

<h1 align="center">Mňamka</h1>

<p align="center">
  A mobile-first cookbook for a shared household — recipes, what you're cooking today,<br />
  an aggregated shopping list and a pantry that knows what you already have.
</p>

<p align="center">
  <sub>SvelteKit 2 · Svelte 5 runes · Convex · Tailwind 4 · Bun</sub>
</p>

</div>

---

> **This repository is the application, not the cookbook.** The recipe corpus it
> was built around isn't mine to redistribute, so no recipe data ships here — see
> [Bringing your own recipes](#bringing-your-own-recipes). A fresh clone runs
> against an empty database.

## What it does

It replaces a spreadsheet. Four tabs, each one step of the same weekly loop:

| Tab            | Route     | What it does                                                                                     |
| -------------- | --------- | ------------------------------------------------------------------------------------------------ |
| **Recepty**    | `/`       | The corpus, with diacritic-insensitive search (`ryza` finds `ryža`), category chips, diet filter |
| **Dnes varím** | `/dnes`   | What you picked to cook, with a kcal-variant switch and a portion multiplier                     |
| **Nákup**      | `/nakup`  | One shopping list built from those picks — quantities summed, grouped by aisle                   |
| **Špajza**     | `/spajza` | What's already in the cupboard, so the shopping list stops asking you to buy it                  |

The interesting part is the seam between the last three. Flag a few recipes,
pick a variant and a multiplier, and **Nákup** aggregates their ingredients by
`(normalized name, unit)`, scales each by its recipe's multiplier, groups the
result by product type and crosses off anything **Špajza** says you own — while
preserving what you'd already ticked off on the current trip. That aggregation
is a pure function (`src/lib/helpers/shopping.ts`), unit-tested independently of
Convex, and reused verbatim by the mutation that persists it.

### Profiles

One deployment, two kitchens. A first-run "Kto si?" prompt asks for a name and
stores `{ userId: slugify(name), name }` in `localStorage`. Favourites, "Dnes
varím" picks, pantry and shopping list are all scoped to that `userId`; the
recipe corpus stays shared and read-only. Type the same name on another device
and you land on the same data.

## How it fits together

```
SvelteKit (Vercel)                          Convex
┌──────────────────────────────┐            ┌─────────────────────────────┐
│  hooks.server.ts             │            │  recipes · pantry · shopping│
│    └─ password gate ─────────┼── token ──▶│    └─ requireToken(token)   │
│  +layout.server.ts           │            │    └─ every personal read,  │
│    └─ hands APP_TOKEN to the │            │       write and delete      │
│       client after login     │            │       scoped by userId      │
│  routes/ (4 tabs)            │◀── live ───┤  storage: recipe photos     │
└──────────────────────────────┘   queries  └─────────────────────────────┘
```

Convex live queries mean no client-side cache to invalidate: a mutation on one
device repaints the other. The trade-off is that the deployment URL ships in the
client bundle, which is what the token below is for.

## Security model

Two layers, deliberately simple, sized for a household rather than a SaaS:

1. **A shared password** (`/login`). The session cookie is `HMAC-SHA256(key =
APP_PASSWORD, message = fixed payload)`, `httpOnly`, `SameSite=Lax`, and
   `Secure` whenever the request is HTTPS. Because the key _is_ the password,
   changing `APP_PASSWORD` invalidates every session everywhere — that's the
   "log everyone out" lever. Attempts are rate-limited per client address
   (`src/lib/server/utils/rateLimit.ts`).
2. **A shared token** (`APP_TOKEN`). The SvelteKit gate can't protect Convex,
   whose URL is public, so every Convex function takes a token and checks it in
   constant time. The server hands it to the browser only after login.

> **Trust boundary.** A profile is a _preference, not a credential_: it keeps two
> people's lists apart, it does not isolate them from each other. The shared
> password is the only real boundary. Share it with someone you'd share a kitchen
> with.

> **The test password is public.** Cypress and the UI-proof script fall back to a
> hard-coded `kucharka-dev` so they run without env. Fine on a laptop; anything
> internet-reachable needs a real `APP_PASSWORD`, and an `APP_TOKEN` freshly
> random per deployment (`openssl rand -hex 24`).

## Getting started

```bash
bun install
bunx convex dev --once                     # provisions a dev deployment, writes .env.local
cp .env.example .env                       # set APP_PASSWORD + APP_TOKEN
bunx convex env set APP_TOKEN <same-value> # Convex needs the same token
bun run dev                                # http://localhost:5173
```

You'll get the full app against an empty database. To put food in it:

## Bringing your own recipes

The importer reads a local `seed/` tree — gitignored, never published. Produce
files matching `RecipeSeedSchema` (`src/lib/schemas/schemas.ts`), then:

```bash
bun tools/seed/import.ts --dry-run    # validate + report, writes nothing
bun tools/seed/import.ts              # upload photos, upsert recipes
bun tools/seed/import.ts --user anna  # who owns the starter pantry + flagged recipes
```

It's idempotent — recipes upsert by slug, pantry by `(userId, nameNorm)`, photo
uploads cached per deployment — so re-run it freely. It prints per-source counts
and an anomaly report (missing photos or macros, implausible kcal) for
spot-checking.

`tools/extract/` holds the parsers that built the original corpus from local
documents and a spreadsheet. They're here because they document how the data
model gets populated; they read files you supply.

<details>
<summary>Two tests depend on the corpus</summary>

`ingredientIcon.test.ts` checks the emoji/tint map against every ingredient in
`seed/blueprint.json`. Those two cases skip automatically when the file is
absent, so a fresh clone runs green (140 passed + 2 skipped instead of 142).
They're skipped, not weakened.

</details>

## Deploying

`svelte.config.js` picks the adapter off Vercel's own `VERCEL` env var:
`@sveltejs/adapter-vercel` there, `@sveltejs/adapter-node` locally — so the
local E2E flow, which serves `node build/index.js`, keeps working.

```bash
# 1. Provision the Convex production deployment (prints its URL)
bunx convex deploy

# 2. APP_TOKEN is NOT inherited from dev — set it on prod explicitly
bunx convex env set APP_TOKEN <value> --prod

# 3. Seed production
PUBLIC_CONVEX_URL=<prod-url> APP_TOKEN=$(bunx convex env get APP_TOKEN --prod) \
  bun tools/seed/import.ts --user <profile>
```

Then set these in Vercel for **Production _and_ Preview**, and deploy:

| Variable            | Value                                      |
| ------------------- | ------------------------------------------ |
| `PUBLIC_CONVEX_URL` | the production deployment URL from step 1  |
| `APP_PASSWORD`      | the shared password — not the test default |
| `APP_TOKEN`         | must match what step 2 set on Convex prod  |

> **Pass `PUBLIC_CONVEX_URL`, not `CONVEX_URL`.** The importer reads
> `Bun.env.PUBLIC_CONVEX_URL`, and Bun auto-loads `.env.local` — so a misnamed
> override silently seeds your **dev** deployment, with no error.
>
> After its fuzzy-match list the importer goes **silent for several minutes**
> while it uploads photos one at a time. The next line is `✓ images: N
available`. That pause is not a hang. Don't run two importers at once; they
> race on the upload cache.

<details>
<summary>Migrating a deployment that predates profiles</summary>

Such a deployment has favourites on the shared recipe document and owner-less
pantry rows. A **fresh** deployment needs nothing; an existing one needs a
one-shot, idempotent migration:

```bash
bunx convex run migrations:adoptLegacyState '{"userId":"<profile>"}'
```

It copies legacy flags into `recipeState`, stamps `userId` on every pantry and
shopping row, and strips the legacy fields. Deliberately not wired into a build
step — a data-destructive mutation shouldn't run on every deploy.

Convex validates the schema against existing documents on deploy, so stage it:
widen (new fields `v.optional`), migrate, then tighten. Dropping `isFavorite`
before the migration has stripped it will fail the deploy.

</details>

## Development

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `bun run dev`       | Dev server on :5173                   |
| `bunx convex dev`   | Convex dev deployment (watch mode)    |
| `bun run check`     | TypeScript + Svelte type check        |
| `bun run lint`      | Prettier + ESLint                     |
| `bun run test:unit` | Vitest (server + browser projects)    |
| `bun run e2e`       | Cypress smoke flow (needs Convex dev) |
| `bun run build`     | Production build                      |
| `bun changeset`     | Add a changeset for your change       |

House rules, enforced by review rather than tooling:

- Zod schemas live in `src/lib/schemas/schemas.ts` — never inline.
- Env vars are declared and validated in `src/lib/server/env.server.ts` — never
  read `Bun.env` / `process.env` elsewhere.
- `src/lib/components/ui/` is shadcn-svelte output; change it via the CLI, not by
  hand.
- Tailwind utilities only — no `<style>` blocks.
- Tests are `*.test.ts` (server) or `*.svelte.test.ts` (browser).

`CLAUDE.md` and `.claude/docs/` carry the long-form version, topic by topic.

## Licence

No licence — all rights reserved. Read it, learn from it; ask before reusing it.
