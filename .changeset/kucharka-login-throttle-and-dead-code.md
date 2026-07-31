---
'kucharka': patch
---

fix: throttle login attempts, harden the Convex token check, drop dead template scaffolding

- **`/login` now rate-limits by client address** — 10 attempts per 15 minutes via `src/lib/server/utils/rateLimit.ts`, consumed before the password is checked. The gate previously accepted unlimited guesses, which is the whole security boundary once the app is on a public URL with a memorable shared password. A correct password clears the window, so a fumbled attempt never locks the household out. State is in-memory and therefore per-instance on Vercel: it turns unbounded online guessing into slow guessing, not a distributed lock.
- **`requireToken` compares in constant time** (`convex/lib.ts`). `!==` returns on the first differing byte, leaking how much of the token matched — the same side channel `session.ts` already avoided for the password, now consistent across both guards.
- Removed three unused Clinigma-template modules and their tests (**−292 lines**): `server/utils/crypto.ts` (a JWT helper for JWTs this app has never issued), `server/utils/errors.ts` (the `createHttpError` family — never called, and `logging-and-errors.md` documents the opposite convention: throw plain `Error` from services), and `server/utils/i18n.ts` (an `Accept-Language` server translator; every string here renders through `d` in a component). `.claude/docs/i18n.md` now records that there is deliberately no server-side translation.
- Dropped the `mode-watcher` and `@internationalized/date` dependencies — zero imports anywhere, including `src/lib/components/ui/`.
- `ProfileSwitcher` hand-rolled avatar initials while the tested `getInitials` helper sat unused; it now uses the helper, which took the component's more robust whitespace handling (trim, split on whitespace runs) plus tests for those cases.
- `+error.svelte` still titled itself „Kucharka" from before the Mňamka rename — now `{d.appTitle}`, so the error page matches the app everywhere else.
