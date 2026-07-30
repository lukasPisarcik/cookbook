/**
 * Playwright UI verification — drives the running app at a mobile viewport
 * (390×844) through every feature and captures screenshot proof.
 *
 * Part of the validation gate for user-facing changes (see
 * .claude/docs/dev-cycle.project.md → "UI verification").
 *
 * Prerequisites: `bun run dev` running on :5173 (plus a seeded Convex dev
 * deployment) and the Playwright Chromium headless shell installed
 * (`bunx playwright install chromium`).
 *
 * Usage:
 *   bun tools/verify/ui-proof.mjs [output-dir]   # default: .verify/
 *
 * Exits non-zero on any uncaught page error, failed navigation, or missing
 * feature element — screenshots land in the output dir either way.
 */

import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { chromium } from 'playwright-core';

const BASE_URL = process.env.UI_PROOF_BASE_URL ?? 'http://localhost:5173';
const PASSWORD = process.env.UI_PROOF_PASSWORD ?? process.env.APP_PASSWORD ?? 'kucharka-dev';
const OUT = process.argv[2] ?? '.verify';

function findChromium() {
	if (process.env.UI_PROOF_CHROMIUM) return process.env.UI_PROOF_CHROMIUM;
	const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
	const shell = readdirSync(cache)
		.filter((name) => name.startsWith('chromium_headless_shell-'))
		.sort()
		.at(-1);
	if (!shell) {
		throw new Error('Playwright Chromium not found — run `bunx playwright install chromium` first');
	}
	return join(cache, shell, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({
	viewport: { width: 390, height: 844 },
	locale: 'sk-SK'
});

const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

let step = 0;
async function shot(name) {
	step += 1;
	await page.screenshot({ path: join(OUT, `${String(step).padStart(2, '0')}-${name}.png`) });
	console.log(`✓ ${String(step).padStart(2, '0')}-${name}`);
}

// --- Login gate -------------------------------------------------------------
await page.goto(BASE_URL);
await page.waitForURL('**/login');
await shot('login');

await page.fill('input[name="password"]', 'definitely-wrong');
await page.click('button[type="submit"]');
await page.waitForSelector('[role="alert"]');
await shot('login-wrong-password');

await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(BASE_URL + '/');

// --- Recepty: grid, search, category filter ---------------------------------
await page.waitForSelector('a[href^="/recepty/"]', { timeout: 20000 });
await page.waitForTimeout(1200);
await shot('recepty-grid');

await page.fill('input[type="search"]', 'thajske');
await page.waitForTimeout(1000);
await shot('recepty-search-diacritic-free');
await page.fill('input[type="search"]', '');

await page.click('button:has-text("Dezerty")');
await page.waitForTimeout(800);
await shot('recepty-category-filter');
await page.click('button:has-text("Všetky")');

// --- Detail: variant switcher, favorite, Dnes varím -------------------------
await page.goto(BASE_URL + '/recepty/thajske-kari');
await page.waitForSelector('[data-testid="variant-switcher"]', { timeout: 15000 });
await page.waitForTimeout(800);
await shot('detail-400kcal');

await page.click('[role="tab"]:has-text("600 kcal")');
await page.waitForTimeout(500);
await shot('detail-variant-600kcal');

await page.click('button[aria-pressed]');
await page.waitForTimeout(500);
await shot('detail-favorite-toggled');
await page.click('button[aria-pressed]'); // restore

const cookButton = page
	.locator('button', { hasText: /dnes varím|dnes nevarím|cook today|not today/i })
	.last();
if (/dnes varím|cook today/i.test(await cookButton.textContent())) {
	await cookButton.click();
	await page.waitForTimeout(500);
}

// --- Dnes varím: list, multiplier, generate ----------------------------------
await page.goto(BASE_URL + '/dnes');
await page.waitForSelector('button[aria-label="+"]', { timeout: 15000 });
await page.locator('button[aria-label="+"]').first().click();
await page.waitForTimeout(500);
await shot('dnes-multiplier');

await page.click('button:has-text("Vygenerovať"), button:has-text("Generate")');
await page.waitForURL('**/nakup', { timeout: 15000 });

// --- Nákup: grouped list, check-off, pantry override -------------------------
await page.waitForSelector('[data-slot="checkbox"]', { timeout: 15000 });
await page.waitForTimeout(800);
await shot('nakup-grouped');

await page.locator('[data-slot="checkbox"]').first().click();
await page.waitForTimeout(500);
await shot('nakup-checked');

const pantrySection = page.locator('details summary');
if ((await pantrySection.count()) > 0) {
	await pantrySection.first().click();
	await page.waitForTimeout(500);
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(400);
	await shot('nakup-mam-doma-override');
}

// --- Špajza: autocomplete ----------------------------------------------------
await page.goto(BASE_URL + '/spajza');
await page.waitForSelector('input[type="text"]', { timeout: 15000 });
await page.waitForTimeout(800);
await page.fill('input[type="text"]', 'cibu');
await page.waitForTimeout(800);
await shot('spajza-autocomplete');
await page.fill('input[type="text"]', '');

// --- Language + theme ---------------------------------------------------------
await page.goto(BASE_URL + '/');
await page.waitForSelector('a[href^="/recepty/"]', { timeout: 15000 });
await page.click('header button:has-text("🇸🇰")');
await page.waitForTimeout(600);
await shot('english-ui');
await page.click('header button:has-text("🇺🇸")');

await page.click('header button[aria-label*="tému"], header button[aria-label*="theme"]');
await page.waitForTimeout(600);
await shot('dark-mode');

await browser.close();

if (pageErrors.length > 0) {
	console.error(`✗ ${pageErrors.length} uncaught page error(s):`);
	for (const error of pageErrors) console.error(`  - ${error}`);
	process.exit(1);
}
console.log(`\nall ${step} proofs captured in ${OUT}/ — no page errors`);
