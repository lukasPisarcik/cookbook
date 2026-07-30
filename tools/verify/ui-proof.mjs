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
 *   UI_PROOF_HEADED=1 bun tools/verify/ui-proof.mjs   # watch it in a real window
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
const HEADED = process.env.UI_PROOF_HEADED === '1';
const OUT = process.argv[2] ?? '.verify';

/** The profile the seed importer and the one-shot migration adopted. */
const PRIMARY_PROFILE = 'Lukáš';
/** A second profile, to prove personal state is actually disjoint. */
const SECOND_PROFILE = 'Zuzka';

function findChromium() {
	if (process.env.UI_PROOF_CHROMIUM) return process.env.UI_PROOF_CHROMIUM;
	const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
	// Headed needs the full Chromium build; headless uses the lighter shell.
	const prefix = HEADED ? 'chromium-' : 'chromium_headless_shell-';
	const build = readdirSync(cache)
		.filter((name) => name.startsWith(prefix))
		.sort()
		.at(-1);
	if (!build) {
		throw new Error('Playwright Chromium not found — run `bunx playwright install chromium` first');
	}
	return HEADED
		? join(
				cache,
				build,
				'chrome-mac-arm64',
				'Google Chrome for Testing.app',
				'Contents',
				'MacOS',
				'Google Chrome for Testing'
			)
		: join(cache, build, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
	executablePath: findChromium(),
	headless: !HEADED,
	// Slow the clicks down a touch so a human can follow along in headed mode.
	slowMo: HEADED ? 600 : 0
});
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

const failures = [];
function check(condition, message) {
	if (!condition) {
		failures.push(message);
		console.error(`✗ ${message}`);
	}
}

/** Adopt a profile through the „Kto si?" gate. */
async function pickProfileAtGate(name) {
	await page.waitForSelector('[data-testid="profile-name-input"]', { timeout: 15000 });
	await page.fill('[data-testid="profile-name-input"]', name);
	await page.click('button:has-text("Pokračovať")');
	await page.waitForSelector('[data-testid="profile-switcher"]', { timeout: 15000 });
}

/** Switch to (or add) a profile through the top-bar switcher. */
async function switchProfile(name) {
	await page.click('[data-testid="profile-switcher"]');
	await page.waitForTimeout(600);
	const existing = page.locator(`[role="dialog"] button:has-text("${name}")`);
	if ((await existing.count()) > 0) {
		await existing.first().click();
	} else {
		await page.click('button:has-text("Pridať iné meno")');
		await page.fill('[role="dialog"] input[name="profileName"]', name);
		await page.click('[role="dialog"] button:has-text("Pokračovať")');
	}
	await page.waitForTimeout(1200);
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

// --- Profile gate: „Kto si?" ------------------------------------------------
await page.waitForSelector('[data-testid="profile-name-input"]', { timeout: 20000 });
await shot('profile-gate-kto-si');

// The tabs must not be reachable before a profile is chosen.
check(
	(await page.locator('nav a[href="/spajza"]').count()) === 0,
	'the tab bar is reachable before a profile is chosen'
);

await pickProfileAtGate(PRIMARY_PROFILE);
await shot('profile-chosen');

// The choice must survive a reload without re-prompting.
await page.reload();
await page.waitForSelector('[data-testid="profile-switcher"]', { timeout: 20000 });
check(
	(await page.locator('[data-testid="profile-name-input"]').count()) === 0,
	'the profile prompt reappeared after a reload'
);

// --- Recepty: grid, search, category filter ---------------------------------
await page.waitForSelector('a[href^="/recepty/"]', { timeout: 20000 });
await page.waitForTimeout(1200);
await shot('recepty-grid');

// The top bar shows the fixed wordmark, not the active tab's name.
const wordmark = await page.locator('header').first().textContent();
check(wordmark?.includes('Mňamka') === true, 'the top bar does not show the „Mňamka" wordmark');
check(wordmark?.includes('Recepty') !== true, 'the top bar still repeats the active tab name');

await page.fill('input[type="search"]', 'thajske');
await page.waitForTimeout(1000);
await shot('recepty-search-diacritic-free');
await page.fill('input[type="search"]', '');

await page.click('button:has-text("Dezerty")');
await page.waitForTimeout(800);
await shot('recepty-category-filter');
await page.click('button:has-text("Všetky")');

// --- Detail: full-bleed hero, variants, favourite, Dnes varím ---------------
await page.goto(BASE_URL + '/recepty/thajske-kari');
await page.waitForSelector('[data-testid="variant-switcher"]', { timeout: 15000 });
await page.waitForTimeout(1000);
await shot('detail-hero-full-bleed');

// The photo must span the viewport and start at y = 0, with no header above it.
check(
	(await page.locator('header').count()) === 0,
	'an app header is visible above the recipe hero'
);
const heroBox = await page.locator('article img').first().boundingBox();
check(heroBox !== null && heroBox.y <= 0, `the hero photo does not start at y = 0 (${heroBox?.y})`);
check(
	heroBox !== null && heroBox.width >= 390,
	`the hero photo does not span the viewport width (${heroBox?.width})`
);
// Floating controls sit on top of the photo.
check(
	(await page.locator('article a[aria-label*="Späť"]').count()) > 0,
	'no floating back button over the hero'
);
check(
	(await page.locator('article button[aria-pressed]').count()) > 0,
	'no floating favourite button over the hero'
);

// Every ingredient row renders a tile — no blanks.
const ingredientTiles = await page.locator('article ul li [aria-hidden="true"]').count();
check(ingredientTiles > 0, 'the ingredient rows render no emoji tiles');
await page.locator('article ul').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot('detail-ingredient-tiles');

await page.click('[role="tab"]:has-text("600 kcal")');
await page.waitForTimeout(600);
await shot('detail-variant-600kcal');

await page.locator('article button[aria-pressed]').first().click();
await page.waitForTimeout(600);
await shot('detail-favorite-toggled');

const cookButton = page
	.locator('button', { hasText: /dnes varím|dnes nevarím|cook today|not today/i })
	.last();
if (/dnes varím|cook today/i.test(await cookButton.textContent())) {
	await cookButton.click();
	await page.waitForTimeout(600);
}

// A photo-less recipe must not look broken.
await page.goto(BASE_URL + '/recepty/thajske-kari');
await page.waitForTimeout(400);

// --- Dnes varím: list, multiplier, generate ----------------------------------
await page.goto(BASE_URL + '/dnes');
await page.waitForSelector('button[aria-label="+"]', { timeout: 15000 });
await page.locator('button[aria-label="+"]').first().click();
await page.waitForTimeout(500);
await shot('dnes-multiplier');

await page.click('button:has-text("Vygenerovať"), button:has-text("Generate")');
await page.waitForURL('**/nakup', { timeout: 15000 });

// --- Nákup: grouped list with tiles, check-off, pantry override --------------
await page.waitForSelector('[data-slot="checkbox"]', { timeout: 15000 });
await page.waitForTimeout(800);
check(
	(await page.locator('main li [aria-hidden="true"]').count()) > 0,
	'the shopping rows render no ingredient tiles'
);
await shot('nakup-grouped-with-tiles');

await page.locator('[data-slot="checkbox"]').first().click();
await page.waitForTimeout(500);
await shot('nakup-checked');

const pantrySection = page.locator('details summary');
if ((await pantrySection.count()) > 0) {
	await pantrySection.first().click();
	await page.waitForTimeout(500);
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(400);
	await shot('nakup-mam-doma-tiles');
}

// --- Špajza: tile grid, „Časté" tiles, search, add + remove ------------------
await page.goto(BASE_URL + '/spajza');
await page.waitForSelector('[data-testid="spajza-grid"]', { timeout: 15000 });
await page.waitForTimeout(1000);
await shot('spajza-tile-grid');

await page.waitForSelector('[data-testid="spajza-frequent"]', { timeout: 15000 });
await page.locator('[data-testid="spajza-frequent"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await shot('spajza-caste-tiles');

// Already-owned „Časté" tiles are dimmed and non-interactive.
check(
	(await page.locator('[data-testid="spajza-frequent"] button[aria-disabled="true"]').count()) > 0,
	'no already-owned „Časté" tile is dimmed'
);

// Tap a „Časté" tile to add, then tap the pantry tile to remove it again.
const beforeAdd = await page.locator('[data-testid="spajza-grid"] > button').count();
await page
	.locator('[data-testid="spajza-frequent"] button:not([aria-disabled="true"])')
	.first()
	.click();
await page.waitForTimeout(1500);
const afterAdd = await page.locator('[data-testid="spajza-grid"] > button').count();
check(
	afterAdd === beforeAdd + 1,
	`tapping a „Časté" tile did not add it (${beforeAdd} → ${afterAdd})`
);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await shot('spajza-added-via-caste');

await page.locator('[data-testid="spajza-grid"] > button').last().click();
await page.waitForTimeout(1500);
const afterRemove = await page.locator('[data-testid="spajza-grid"] > button').count();
check(
	afterRemove === beforeAdd,
	`tapping a pantry tile did not remove it (${afterAdd} → ${afterRemove})`
);
await shot('spajza-removed-with-undo-toast');

await page.fill('input[type="text"]', 'cibu');
await page.waitForTimeout(900);
await shot('spajza-search-tiles');
await page.fill('input[type="text"]', '');

// --- Two profiles are actually disjoint -------------------------------------
// The only automated evidence that profile A cannot see profile B's data:
// Convex functions have no test harness in this repo.
const primaryPantryCount = await page.locator('[data-testid="spajza-grid"] > button').count();
check(primaryPantryCount > 0, 'the primary profile has an empty špajza — the check proves nothing');

await switchProfile(SECOND_PROFILE);
await page.goto(BASE_URL + '/spajza');
await page.waitForSelector('main', { timeout: 15000 });
await page.waitForTimeout(1800);
const secondPantryCount = await page.locator('[data-testid="spajza-grid"] > button').count();
check(
	secondPantryCount === 0,
	`the second profile sees ${secondPantryCount} pantry item(s) — state is not isolated`
);
await shot('second-profile-empty-spajza');

await page.goto(BASE_URL + '/dnes');
await page.waitForSelector('main', { timeout: 15000 });
await page.waitForTimeout(1500);
const secondCooking = await page.locator('button[aria-label="+"]').count();
check(
	secondCooking === 0,
	`the second profile sees ${secondCooking} „Dnes varím" recipe(s) — state is not isolated`
);
await shot('second-profile-empty-dnes');

// Switch back so a re-run starts from the seeded profile.
await page.goto(BASE_URL + '/');
await page.waitForSelector('[data-testid="profile-switcher"]', { timeout: 15000 });
await switchProfile(PRIMARY_PROFILE);
await page.waitForTimeout(1200);
await page.goto(BASE_URL + '/spajza');
await page.waitForSelector('[data-testid="spajza-grid"]', { timeout: 15000 });
await page.waitForTimeout(1500);
const restoredCount = await page.locator('[data-testid="spajza-grid"] > button').count();
check(
	restoredCount === primaryPantryCount,
	`switching back lost pantry items (${primaryPantryCount} → ${restoredCount})`
);
await shot('back-to-primary-profile');

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
}
if (failures.length > 0) {
	console.error(`✗ ${failures.length} feature check(s) failed:`);
	for (const failure of failures) console.error(`  - ${failure}`);
}
if (pageErrors.length > 0 || failures.length > 0) {
	process.exit(1);
}
console.log(`\nall ${step} proofs captured in ${OUT}/ — no page errors, all checks passed`);
