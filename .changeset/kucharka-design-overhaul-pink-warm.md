---
'kucharka': minor
---

feat: full visual redesign — pink accent, warm surfaces, list-row recipes, Notion-style shopping list

- Replaced the template's cold sky-blue accent with the **trip-planner pink** (`hsl(335 70% 60%)`, brighter on dark) as the single action colour across chips, CTAs, step badges, checked checkboxes, the active tab and favourite hearts — the v1 skin was an untouched shadcn scaffold the owner disliked. `destructive` stays red so "danger" and "loved" no longer share a colour.
- Re-tokenised `src/app.css` into a **warm surface system**: porcelain canvas with white floating cards in light, warm near-black with elevated cards in dark, warm hairlines, pink selection and focus ring, radius bumped to `1rem`. Re-skins every shadcn primitive without touching `src/lib/components/ui/`.
- **Recepty** switched from a 2-column photo grid to vertical list rows (thumbnail · title · ⏱ prep-time / kcal · chevron) — denser and faster to scan; `recipes.list` now projects `prepTimeMinutes` (additive, backward-compatible).
- **Nákup** rebuilt as a Notion-style to-do list: flat borderless rows, rounded-square checkboxes, strikethrough-and-fade on check, row hover, small muted group headers and a thin pink progress bar (a native `<progress>`, so the fill stays an attribute rather than an inline style). **Špajza** follows the same row language.
- **Recipe detail** gained a three-tile meta row (kcal · porcie · min), pink step-number badges, a pink-tinted fun-fact callout and a rounded hero; **Dnes** and **Login** moved onto the same floating-card language.
- New **heart-steam-pot logo** (pink pot, steam curling into a heart) replaces the salad bowl in the TopBar, both favicons and all three PWA icons — now reproducible via `bun tools/icons/render-icons.mjs` instead of hand-exported. Browser and manifest theme colours follow at `#e0528d`.
- Titles, screen headings and section labels now render in self-hosted **Bricolage Grotesque** (`@fontsource-variable`, latin-ext subset for Slovak diacritics); body text keeps the system stack, so there is no CLS risk.
