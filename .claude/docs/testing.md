# Testing

Applies to: `*.test.ts`, `*.svelte.test.ts`, `cypress/e2e/*.cy.ts`.

## Three runners, one convention

| Runner                    | File pattern          | Purpose                                                                                                                                                                        |
| ------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vitest server project** | `*.test.ts`           | Plain TS units: services, helpers, schemas, route handlers, remote function logic. Runs in Node environment with SvelteKit virtual modules stubbed in `tests/setup-server.ts`. |
| **Vitest client project** | `*.svelte.test.ts`    | Svelte components + page tests. Runs in real Chromium via `@vitest/browser-playwright`. SvelteKit virtuals resolve naturally.                                                  |
| **Cypress**               | `cypress/e2e/*.cy.ts` | E2E smoke flows — full SvelteKit SSR + browser. Use sparingly; prefer Vitest browser tests for component behavior.                                                             |

## File naming

- Server-side test for `src/lib/server/services/foo.service.ts` → `foo.service.test.ts` next to it.
- Component test for `src/lib/essentials/Header.svelte` → `Header.svelte.test.ts` next to it.
- E2E spec → `cypress/e2e/<feature>.cy.ts`.

## Test what matters

Focus tests on:

- **Behavior with side effects** — what the service does, not how.
- **Edge cases** specific to your code (empty arrays, off-by-one, error paths).
- **Integration boundaries** — schema parsing, request/response shapes.

Skip tests for:

- Library behavior already covered by the library's own tests (Zod enum membership, UUID format, basic shape parsing).
- Trivial getters / pure type re-shapes.

## Mocking

- Use `vi.mock('$lib/...')` with a getter wrapper for top-level state — plain property triggers TDZ in factories.
- For env vars, prefer `vi.stubEnv('VAR', 'value')` + `vi.unstubAllEnvs()` in `afterEach`.
- For Svelte stores, mock the store module with `vi.hoisted(() => ({ ... }))`.

## Coverage

`vitest.config.ts` excludes shadcn primitives, the dictionary, harness/stub files, and test-utils from coverage. Don't add tests just to hit a percentage — coverage is a guide, not a goal.

Coverage thresholds are enforced in `vitest.config.ts` (lines 85, statements 85, functions 80, branches 75). Bump up as the suite grows; never lower.

The server unit-test CI job runs inside `oven/bun:1`, where Bun's stubbed `node:inspector` rejects the V8 Coverage API. `vitest.config.ts` therefore sets `provider: 'istanbul'` and emits `cobertura` so Azure DevOps' `PublishCodeCoverageResults@2` can consume it. The CI pipeline merges the server + browser cobertura reports via `reportgenerator` before publishing — see `cicd/stages/test.yml` (`CoverageMerge` job).

## Running tests

```sh
bun run test:server            # Vitest server project
bun run test:server:watch      # Watch mode
bun run test:server:coverage   # With coverage (./coverage/server)
bun run test:browser           # Vitest browser project (real Chromium)
bun run test:browser:watch     # Watch mode
bun run test:browser:coverage  # With coverage (./coverage/browser)
bun run test:unit              # Both projects (no coverage)
bun run test:coverage          # Both projects with merged coverage
bun run e2e                    # Cypress (builds + previews first)
bun run e2e:open               # Cypress UI (builds + previews first)
bun run test                   # check + lint + test:unit (pre-commit/CI)
```
