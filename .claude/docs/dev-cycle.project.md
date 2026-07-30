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
bun run build        # production build (adapter-node)
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
7. `seed/` and `convex/_generated/` are generated — excluded from
   prettier/eslint; don't hand-edit seed output (fix the extractor/importer).

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
at **390×844** through every feature: login gate (wrong + right password), grid,
diacritic-insensitive search, category filter, recipe detail with kcal-variant
switch, favorite toggle, Dnes varím + portion multiplier, shopping-list
generation, check-off, „Mám doma" override, Špajza autocomplete, EN toggle and
dark mode. Screenshots land in `.verify/` (gitignored); the script exits
non-zero on any uncaught page error. Review the frames visually — a green exit
only proves no crashes, not good looks.

Config via env: `UI_PROOF_BASE_URL` (default `http://localhost:5173`),
`UI_PROOF_PASSWORD` (default `kucharka-dev`), `UI_PROOF_CHROMIUM` (explicit
browser binary).

## Bug telemetry

None — no observability MCP is connected and the app is personal/local-first.
Work from a local reproduction (`bun run dev` + seeded Convex dev deployment)
and say telemetry wasn't consulted.

## Data / seed pipeline (project-specific stage)

The recipe corpus is generated once by `tools/extract/` (+ a multi-agent LLM
extraction) and committed under `seed/`; `bun tools/seed/import.ts` validates
with `RecipeSeedSchema`, merges kcal variants by normalized title, reconciles
against `seed/blueprint.json` (workbook ingredients are authoritative), uploads
photos and upserts by slug — idempotent, user state preserved. `--dry-run`
validates + reports without writing. Anomalies (missing photos/macros,
suspicious kcal, fuzzy title matches) print for manual spot-checking.
