---
'kucharka': minor
---

feat: Kuchárka v1 — the full personal cookbook app

- Four mobile-first bottom tabs backed by Convex live queries: **Recepty** (photo card grid with diacritic-insensitive search, category chips, diet-tag filter, favorites), **Dnes varím** (flagged recipes with kcal-variant and portion-multiplier controls), **Nákup** (aggregated shopping list grouped by product type, quantities summed per ingredient+unit, pantry items auto-excluded with a per-trip „kúpim aj tak" override, checked state synced across devices) and **Špajza** (persistent pantry with autocomplete).
- One-time extraction pipeline (`tools/extract/`, `tools/seed/`) turned all 95 source documents (93 PDFs, ONVIA DOCX, the Zoznam receptov workbook) into 635 validated recipes with photos in Convex — kcal-group PDFs merged into single recipes with a variant switcher, all 129 blueprint codes reconciled with workbook ingredients as the authority.
- Shared-password gate (`/login`, HMAC-signed httpOnly cookie) plus an `APP_TOKEN` guard on every public Convex function, since the deployment URL ships in the client bundle.
- New visual identity: salad-bowl logo (TopBar, favicon, PWA manifest icons), sky-blue accent in light and dark mode, installable web manifest, Slovak-default SK/EN dictionaries.
