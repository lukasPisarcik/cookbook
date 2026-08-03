# Dev-cycle project binding — Kuchárka

The project-specific half of the dev-cycle contract. The generic stages, handoff,
loops and taxonomy live in the global `~/.claude/docs/dev-cycle.md`; this file is
authoritative for everything concrete in **this** repo.

## Validation gate

Run in this order (cheap → slow); all must pass. Apply the validation-loop
protocol from the contract — fix and re-run, never weaken a gate.

```bash
bun run check        # svelte-kit sync + svelte-check
bun run lint         # prettier --check + eslint
bun run test:unit    # Vitest server + browser (Chromium) projects
bun run build        # production build — adapter-node locally, adapter-vercel on Vercel
```

`svelte.config.js` selects the adapter on the presence of Vercel's own `VERCEL`
env var, so the local gate exercises the Node build (which `bun run e2e` serves)
while Vercel builds serverless functions. To prove the other branch locally:

```bash
VERCEL=1 bun run build   # must also succeed — it is what Vercel runs
```

**User-facing changes additionally require the Playwright UI proof** (see
"UI verification"). It is part of the gate, not optional garnish:

```bash
bun run dev &                        # app on :5173 (Convex dev deployment seeded)
bun tools/verify/ui-proof.mjs        # 15 screenshot proofs → .verify/, fails on page errors
```

E2E (Cypress) is **local-only, on demand** — it needs a live seeded Convex dev
deployment and env sourced into the shell:

```bash
set -a; source .env; source .env.local; set +a
bun run e2e          # builds, serves on :4173 (ORIGIN set), runs smoke + error-pages
```

## Hard rules

Summarised from `CLAUDE.md` (authoritative) — read before editing:

1. All Zod schemas in `src/lib/schemas/schemas.ts`; never inline.
2. All env vars declared in `src/lib/server/env.server.ts` (Zod-validated);
   never read `Bun.env` / `process.env` / `$env/*` elsewhere. `PUBLIC_CONVEX_URL`
   is the one public-env exception, read only in `src/lib/convex.ts`.
3. Never edit `src/lib/components/ui/` (shadcn-svelte generated).
4. Tailwind utilities only — no `<style>` blocks, no standalone CSS beyond
   `src/app.css`, no inline `style=`.
5. Tests: `*.test.ts` (server project) / `*.svelte.test.ts` (browser project).
6. Every public Convex function takes a `token` argument checked by
   `requireToken` (`convex/lib.ts`) — the SvelteKit gate cannot protect the
   Convex deployment itself.
7. Every Convex function touching **personal** state (favourites, „Dnes varím",
   špajza, nákup) also takes `userId` and scopes every read, write **and delete
   sweep** by it. Client queries pass `'skip'` until `profileStore` resolves.
   `userId` is trusted, not verified — see the trust boundary in `README.md`.
8. `seed/` and `convex/_generated/` are generated — don't hand-edit either (fix
   the extractor/importer instead). `seed/` is in `.prettierignore`;
   `convex/_generated/` is **not**, so after a `bunx convex dev` regenerates it
   you must `bun run format` before `bun run lint` passes.

## VCS, branch base & PR mechanism

- **Base branch:** `main`. Never commit to or push it directly (exception: the
  repo-bootstrap baseline).
- **Branch naming:** `<type>/<slug>` from the plan's `#plan-meta`
  (`feat/…`, `fix/…`, `chore/…`).
- **Commit style:** Conventional Commits; concise user-facing summary line,
  body bullets for the what/why.
- **Opening the PR:** `gh pr create --base main --head <branch>` with title =
  the commit summary and body = summary + plan path + Acceptance-Criteria
  checklist + validation table. Never auto-merge.
- **Fallback:** if `gh` is unavailable, push the branch and surface
  `https://github.com/lukasPisarcik/cookbook/pull/new/<branch>`.

## Change-documentation convention

Changesets (`.changeset/*.md`, `bun changeset` or write the file directly).

- **Bump scheme:** major = breaking behaviour change · minor = new feature ·
  patch = fix/tweak.
- **Format:** frontmatter `'kucharka': <bump>`, then a `type: summary` line and
  a few enriched bullets (what + why, no minutiae).
- **Exempt:** docs-only, `.claude/`-only, formatting-only, and test-only changes.

## UI verification

`tools/verify/ui-proof.mjs` — Playwright (playwright-core + the Chromium
headless shell from `bunx playwright install chromium`) drives the running app
at **390×844** through every feature: login gate (wrong + right password), the
**„Kto si?" profile gate** (and that the tabs are unreachable before a name is
chosen, and that the choice survives a reload), grid, diacritic-insensitive
search, category filter, the **full-width recipe hero** (asserting the header is
present, the photo spans the viewport and sits flush under it, and that the
header stays pinned while the photo scrolls away), kcal-variant
switch, favorite toggle, **ingredient tiles**, Dnes varím + portion multiplier,
shopping-list generation with tiles, check-off, „Mám doma" override, the
**Špajza tile grid** (add via „Časté", remove, dimmed already-owned tiles),
**two-profile isolation**, EN toggle and dark mode.

Beyond screenshots the script makes ~15 hard assertions (`check(...)`) and exits
non-zero if any fails or on any uncaught page error. Screenshots land in
`.verify/` (gitignored). Review the frames visually — a green exit only proves no
crashes, not good looks.

The **two-profile isolation step is the only automated evidence** that profile A
cannot see profile B's data: Convex functions have no test harness in this repo,
so don't delete it. It switches to a second profile through the top-bar
switcher, asserts an empty špajza and no „Dnes varím" rows, then switches back
and asserts the primary profile's pantry is intact.

Config via env: `UI_PROOF_BASE_URL` (default `http://localhost:5173`),
`UI_PROOF_PASSWORD` (default `kucharka-dev`), `UI_PROOF_CHROMIUM` (explicit
browser binary).

## Bug telemetry

None — no observability MCP is connected and the app is personal/local-first.
Work from a local reproduction (`bun run dev` + seeded Convex dev deployment)
and say telemetry wasn't consulted.

## Dev-seed workflow (`--limit` / `--prune`)

The dev deployment does **not** need the full 635-recipe corpus. Seed a subset:

```bash
bun tools/seed/import.ts --limit 40 --prune   # dev: ~40 recipes, photos kept
bun tools/seed/import.ts                      # prod: full corpus
```

**`--prune` is not optional on a deployment that already holds more.** The
importer upserts by slug and never deletes, so `--limit 40` on its own leaves
all 635 previously imported documents in place and saves nothing. `--prune`
deletes the recipes and `recipeCards` rows outside the selected set (it leaves
per-user `recipeState` alone — those rows are keyed by slug, cost nothing when
orphaned, and are picked up again by a later full import).

The subset is deterministic: `PINNED_SLUGS` (currently `thajske-kari`, which
`tools/verify/ui-proof.mjs` hard-codes and asserts a photo on) first, then
round-robin across categories ordered by slug, so every filter chip — „Dezerty"
included — still has data. The importer exits non-zero if a pinned slug is
missing or has no photo. **If a ui-proof assertion fails after a `--limit` run,
extend `PINNED_SLUGS` — never relax the assertion.**

Both new tables are populated **only by an import**, so re-run the importer
against prod after deploying schema changes that touch them. Order matters: push
the schema and seed _before_ the query rewrite reaches prod, or `corpusMeta`
reads return `[]` and the UI silently loses its filter chips, autocomplete and
„Časté" tiles (it fails soft, with no visible error).

### Stale deployments

Delete unused Convex deployments rather than leaving them around — each full
corpus copy is ~65 MB of file storage against a 0.5 GB budget, and preview
deployments should never be seeded with images.

## Data / seed pipeline (project-specific stage)

The recipe corpus is generated once by `tools/extract/` (+ a multi-agent LLM
extraction) and committed under `seed/`; `bun tools/seed/import.ts` validates
with `RecipeSeedSchema`, merges kcal variants by normalized title, reconciles
against `seed/blueprint.json` (workbook ingredients are authoritative), uploads
photos and upserts by slug — idempotent, user state preserved. `--dry-run`
validates + reports without writing. Anomalies (missing photos/macros,
suspicious kcal, fuzzy title matches) print for manual spot-checking.
