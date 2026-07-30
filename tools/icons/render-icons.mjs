/**
 * Renders the brand mark (`src/lib/assets/logo.svg`) into the three PWA PNG
 * icons, so the icon set is reproducible instead of hand-exported.
 *
 * Reuses the Playwright Chromium headless shell that the UI proof already
 * requires (`bunx playwright install chromium`).
 *
 * Outputs:
 *   static/icons/icon-192.png          mark on the warm canvas, safe padding
 *   static/icons/icon-512.png          same, larger
 *   static/icons/icon-maskable-512.png white mark, full-bleed pink field,
 *                                      20% safe-zone padding
 *
 * Usage:
 *   bun tools/icons/render-icons.mjs
 */

import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(root, 'static', 'icons');

/** Brand colours — must stay in sync with `--primary` in `src/app.css`. */
const PINK = '#e0528d';
const CANVAS = '#faf7f5';

function findChromium() {
	if (process.env.UI_PROOF_CHROMIUM) return process.env.UI_PROOF_CHROMIUM;
	const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
	const build = readdirSync(cache)
		.filter((name) => name.startsWith('chromium_headless_shell-'))
		.sort()
		.at(-1);
	if (!build) {
		throw new Error('Playwright Chromium not found — run `bunx playwright install chromium` first');
	}
	return join(cache, build, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
}

const logo = readFileSync(join(root, 'src', 'lib', 'assets', 'logo.svg'), 'utf8');

/** Flatten the two-tone mark to white for the maskable icon's pink field. */
const whiteLogo = logo.replaceAll('#b23a6f', '#ffffff').replaceAll('#e0528d', '#ffffff');

/**
 * @param {object} options
 * @param {string} options.svg    inline SVG markup for the mark
 * @param {string} options.bg     page background colour
 * @param {number} options.inset  fraction of the canvas kept clear on each side
 */
function pageHtml({ svg, bg, inset }) {
	const size = `${(1 - inset * 2) * 100}%`;
	return `<!doctype html>
<html>
	<head>
		<style>
			html, body { margin: 0; height: 100%; }
			body {
				background: ${bg};
				display: flex;
				align-items: center;
				justify-content: center;
			}
			svg { width: ${size}; height: ${size}; display: block; }
		</style>
	</head>
	<body>${svg}</body>
</html>`;
}

const targets = [
	{ file: 'icon-192.png', size: 192, svg: logo, bg: CANVAS, inset: 0.08 },
	{ file: 'icon-512.png', size: 512, svg: logo, bg: CANVAS, inset: 0.08 },
	{ file: 'icon-maskable-512.png', size: 512, svg: whiteLogo, bg: PINK, inset: 0.2 }
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: findChromium() });

for (const target of targets) {
	const page = await browser.newPage({
		viewport: { width: target.size, height: target.size },
		deviceScaleFactor: 1
	});
	await page.setContent(pageHtml(target), { waitUntil: 'load' });
	await page.screenshot({ path: join(OUT_DIR, target.file) });
	await page.close();
	console.log(`✓ ${target.file} (${target.size}×${target.size})`);
}

await browser.close();
console.log(`\n${targets.length} icons written to static/icons/`);
