#!/usr/bin/env bash
# Extract recipe photos from the source corpus into seed/images/.
#
# - Every PDF: the largest raster image per page (photos, not icons) via
#   `pdfimages`, converted to WebP ≤ 1200 px wide:
#     seed/images/<pdf-slug>/p<page>.webp
# - ONVIA recepty.docx: every word/media/* image, same conversion:
#     seed/images/onvia/<media-name>.webp
#
# The <pdf-slug> is the PDF basename: lowercase, diacritics stripped,
# non-alphanumerics collapsed to '-'. This must match slugifySourceFile()
# in tools/seed/import.ts.
#
# Requires: poppler (pdfimages), webp (cwebp), unzip.
# Usage: bash tools/extract/extract-images.sh ["/path/to/Všetky recepty"]

set -u

CORPUS="${1:-$HOME/Desktop/Všetky recepty}"
OUT="seed/images"
MIN_BYTES=20000

# macOS filenames are NFD; iconv truncates at combining marks, so slugify
# via Bun with the same rule the import script and extraction agents use.
slugify() {
	SLUG_INPUT="$1" bun -e 'console.log((process.env.SLUG_INPUT ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))'
}

convert_to_webp() {
	cwebp -quiet -q 80 -resize 1200 0 "$1" -o "$2" 2>/dev/null
}

file_size() {
	stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0
}

mkdir -p "$OUT"
total=0

find "$CORPUS" -type f -name '*.pdf' | while IFS= read -r pdf; do
	base="$(basename "$pdf" .pdf)"
	slug="$(slugify "$base")"
	tmp="$(mktemp -d)"
	if ! pdfimages -all -p "$pdf" "$tmp/img" 2>/dev/null; then
		echo "WARN: pdfimages failed for $base" >&2
		rm -rf "$tmp"
		continue
	fi

	# Keep the largest image per page (the recipe photo), skip small assets.
	extracted=0
	pages="$(find "$tmp" -type f -name 'img-*' | sed -E 's/.*img-0*([0-9]+)-[0-9]+\..*/\1/' | sort -nu)"
	for page in $pages; do
		padded="$(printf '%03d' "$page")"
		best=""
		best_size=0
		for candidate in "$tmp"/img-"$padded"-*; do
			[ -f "$candidate" ] || continue
			size="$(file_size "$candidate")"
			if [ "$size" -gt "$best_size" ]; then
				best="$candidate"
				best_size="$size"
			fi
		done
		[ -n "$best" ] && [ "$best_size" -ge "$MIN_BYTES" ] || continue
		mkdir -p "$OUT/$slug"
		if convert_to_webp "$best" "$OUT/$slug/p${page}.webp"; then
			extracted=$((extracted + 1))
			total=$((total + 1))
		fi
	done
	echo "$slug: $extracted image(s)"
	rm -rf "$tmp"
done

# ONVIA docx media
docx="$CORPUS/ONVIA recepty.docx"
if [ -f "$docx" ]; then
	tmp="$(mktemp -d)"
	unzip -o -q "$docx" 'word/media/*' -d "$tmp"
	mkdir -p "$OUT/onvia"
	onvia=0
	find "$tmp/word/media" -type f | while IFS= read -r media; do
		size="$(file_size "$media")"
		[ "$size" -ge "$MIN_BYTES" ] || continue
		name="$(basename "$media")"
		name="${name%.*}"
		convert_to_webp "$media" "$OUT/onvia/${name}.webp" && echo "onvia:${name}"
	done | grep -c '^onvia:' | { read -r onvia; echo "onvia: $onvia image(s)"; }
	rm -rf "$tmp"
fi

echo "done: $(find "$OUT" -name '*.webp' | wc -l | tr -d ' ') images in $OUT"
