#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="$ROOT_DIR/assets/projects"
TOP_SHOTS_DIR="$ROOT_DIR/assets/top-shots"
OUT_DIR="$ROOT_DIR/assets/optimized"

mkdir -p "$OUT_DIR"

optimize_image() {
  local input="$1"
  local output="$2"
  local max_size="$3"
  local quality="$4"

  mkdir -p "$(dirname "$output")"
  sips -s format jpeg -s formatOptions "$quality" -Z "$max_size" "$input" --out "$output" >/dev/null
}

while IFS= read -r cover; do
  rel="${cover#$PROJECTS_DIR/}"
  project_rel="$(dirname "$rel")"
  optimize_image "$cover" "$OUT_DIR/projects/$project_rel/cover.jpg" 1200 72
done < <(
  find "$PROJECTS_DIR" -type f \
    \( -iname "cover.jpg" -o -iname "cover.jpeg" -o -iname "cover.png" -o -iname "cover.webp" -o -iname "cover.avif" \) \
    | sort -f
)

for index in $(seq -w 1 10); do
  source_file=""
  for ext in jpg JPG jpeg JPEG png PNG webp WEBP; do
    candidate="$TOP_SHOTS_DIR/$index.$ext"
    if [[ -f "$candidate" ]]; then
      source_file="$candidate"
      break
    fi
  done

  if [[ -n "$source_file" ]]; then
    optimize_image "$source_file" "$OUT_DIR/top-shots/$index.jpg" 1200 72
  fi
done

printf 'Generated optimized previews in %s\n' "$OUT_DIR"
