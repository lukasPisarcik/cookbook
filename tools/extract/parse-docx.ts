/**
 * Convert `ONVIA recepty.docx` into plain-text chunks for LLM extraction.
 *
 * Keeps `[IMG:media/imageN.ext]` markers (resolved through the relationship
 * table) so extraction agents can attribute the photo nearest to each recipe
 * title, and splits on paragraph boundaries into ~25 KB chunks.
 *
 * Offline tooling — run once with:
 *   bun tools/extract/parse-docx.ts [path-to-docx] [output-dir]
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_SOURCE = join(
	process.env.HOME ?? '~',
	'Desktop',
	'Všetky recepty',
	'ONVIA recepty.docx'
);
const DEFAULT_OUTPUT = '.extract-cache/onvia';
const MAX_CHUNK_CHARS = 25_000;

function decodeEntities(value: string): string {
	return value
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'");
}

export function docxToText(source: string): string {
	const workDir = mkdtempSync(join(tmpdir(), 'onvia-'));
	try {
		execFileSync('unzip', [
			'-o',
			'-q',
			source,
			'word/document.xml',
			'word/_rels/document.xml.rels',
			'-d',
			workDir
		]);
		const xml = readFileSync(join(workDir, 'word/document.xml'), 'utf8');
		const rels = readFileSync(join(workDir, 'word/_rels/document.xml.rels'), 'utf8');

		const relTargets = new Map<string, string>();
		for (const match of rels.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
			relTargets.set(match[1], match[2]);
		}

		const lines: string[] = [];
		for (const paragraph of xml.split('</w:p>')) {
			const texts = [...paragraph.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) =>
				decodeEntities(m[1])
			);
			const images = [...paragraph.matchAll(/r:embed="([^"]+)"/g)]
				.map((m) => relTargets.get(m[1]))
				.filter((target): target is string => target !== undefined)
				.map((target) => `[IMG:${target.replace(/^\/?word\//, '').replace(/^\.\.\//, '')}]`);

			const line = [...images, texts.join('')].join(' ').trim();
			if (line !== '') lines.push(line);
		}
		return lines.join('\n');
	} finally {
		rmSync(workDir, { recursive: true, force: true });
	}
}

export function chunkText(text: string, maxChars: number): string[] {
	const chunks: string[] = [];
	let current = '';
	for (const line of text.split('\n')) {
		if (current.length + line.length + 1 > maxChars && current !== '') {
			chunks.push(current);
			current = '';
		}
		current += (current === '' ? '' : '\n') + line;
	}
	if (current !== '') chunks.push(current);
	return chunks;
}

if (import.meta.main) {
	const source = process.argv[2] ?? DEFAULT_SOURCE;
	const outputDir = process.argv[3] ?? DEFAULT_OUTPUT;

	const text = docxToText(source);
	const chunks = chunkText(text, MAX_CHUNK_CHARS);

	mkdirSync(outputDir, { recursive: true });
	writeFileSync(join(outputDir, 'full.txt'), text);
	chunks.forEach((chunk, index) => {
		writeFileSync(join(outputDir, `chunk-${String(index + 1).padStart(2, '0')}.txt`), chunk);
	});

	console.log(`text chars: ${text.length}`);
	console.log(`chunks: ${chunks.length} (≤ ${MAX_CHUNK_CHARS} chars each)`);
	console.log(`wrote ${outputDir}/full.txt and chunk files`);
}
