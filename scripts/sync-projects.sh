#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="$ROOT_DIR/assets/projects"
OUT_FILE="$PROJECTS_DIR/projects.json"

mkdir -p "$PROJECTS_DIR"

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

title_from_slug() {
  printf '%s' "$1" | tr '_-' ' ' | awk '{
    for (i = 1; i <= NF; i++) {
      $i = toupper(substr($i,1,1)) tolower(substr($i,2))
    }
    print
  }'
}

category_label() {
  case "$1" in
    commercial) printf 'Commercial' ;;
    product) printf 'Product' ;;
    fashion) printf 'Fashion' ;;
    events) printf 'Events' ;;
    documentary) printf 'Documentary' ;;
    street) printf 'Street' ;;
    *) title_from_slug "$1" ;;
  esac
}

category_chip() {
  case "$1" in
    commercial) printf 'Brand & Commercial' ;;
    product) printf 'Product' ;;
    fashion) printf 'Fashion & Editorial' ;;
    events) printf 'Events' ;;
    documentary) printf 'Documentary' ;;
    street) printf 'Street' ;;
    *) printf 'Category' ;;
  esac
}

read_meta_value() {
  local file="$1"
  local key="$2"
  if [[ ! -f "$file" ]]; then
    return 1
  fi
  awk -F '=' -v k="$key" '
    $1 ~ "^[[:space:]]*"k"[[:space:]]*$" {
      val=$2
      sub(/^[[:space:]]+/, "", val)
      sub(/[[:space:]]+$/, "", val)
      print val
      found=1
      exit
    }
    END { if (!found) exit 1 }
  ' "$file"
}

project_dirs=()
while IFS= read -r dir; do
  project_dirs+=("$dir")
done < <(find "$PROJECTS_DIR" -mindepth 2 -maxdepth 2 -type d | sort)

# Collect categories with at least one project.
categories_seen=()
category_exists() {
  local needle="$1"
  local item
  for item in "${categories_seen[@]:-}"; do
    if [[ "$item" == "$needle" ]]; then
      return 0
    fi
  done
  return 1
}

for dir in "${project_dirs[@]:-}"; do
  cat_slug="$(basename "$(dirname "$dir")")"
  if ! category_exists "$cat_slug"; then
    categories_seen+=("$cat_slug")
  fi
done

{
  printf '{\n'
  printf '  "generated_at": "%s",\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  printf '  "categories": ['
  first_cat=1
  for cat_slug in "${categories_seen[@]:-}"; do
    cat_title="$(category_label "$cat_slug")"
    cat_chip="$(category_chip "$cat_slug")"
    if [[ $first_cat -eq 1 ]]; then
      printf '\n'
      first_cat=0
    else
      printf ',\n'
    fi
    printf '    {"slug":"%s","title":"%s","chip":"%s"}' \
      "$(json_escape "$cat_slug")" \
      "$(json_escape "$cat_title")" \
      "$(json_escape "$cat_chip")"
  done
  if [[ $first_cat -eq 0 ]]; then
    printf '\n'
  fi
  printf '  ],\n'

  printf '  "projects": ['
  first_proj=1

  for project_dir in "${project_dirs[@]:-}"; do
    cat_slug="$(basename "$(dirname "$project_dir")")"
    proj_slug="$(basename "$project_dir")"

    default_title="$(title_from_slug "$proj_slug")"
    default_chip="$(category_chip "$cat_slug")"
    default_desc="$(category_label "$cat_slug") project"

    meta_file="$project_dir/meta.txt"
    title="${default_title}"
    chip="${default_chip}"
    description="${default_desc}"
    client="-"
    project_type="$(category_label "$cat_slug")"
    brand_model="-"
    agency="-"
    date_text="$(date -u +"%b %d, %Y")"

    if value="$(read_meta_value "$meta_file" "title" 2>/dev/null)"; then title="$value"; fi
    if value="$(read_meta_value "$meta_file" "chip" 2>/dev/null)"; then chip="$value"; fi
    if value="$(read_meta_value "$meta_file" "description" 2>/dev/null)"; then description="$value"; fi
    if value="$(read_meta_value "$meta_file" "client" 2>/dev/null)"; then client="$value"; fi
    if value="$(read_meta_value "$meta_file" "project" 2>/dev/null)"; then project_type="$value"; fi
    if value="$(read_meta_value "$meta_file" "brand_model" 2>/dev/null)"; then brand_model="$value"; fi
    if value="$(read_meta_value "$meta_file" "agency" 2>/dev/null)"; then agency="$value"; fi
    if value="$(read_meta_value "$meta_file" "date" 2>/dev/null)"; then date_text="$value"; fi

    cover=""
    for ext in jpg jpeg png webp avif Jpg JPG JPEG PNG WEBP AVIF; do
      if [[ -f "$project_dir/cover.$ext" ]]; then
        cover="$project_dir/cover.$ext"
        break
      fi
    done

    media_files=()
    media_dirs=()
    while IFS= read -r media_dir; do
      media_dirs+=("$media_dir")
    done < <(
      find "$project_dir" -mindepth 1 -maxdepth 1 -type d \
        \( -iname "photos" -o -iname "videos" \) | sort -f
    )

    if [[ ${#media_dirs[@]} -gt 0 ]]; then
      while IFS= read -r file; do
        media_files+=("$file")
      done < <(
        find "${media_dirs[@]}" -type f ! -name ".DS_Store" 2>/dev/null | sort -V
      )
    fi

    if [[ -z "$cover" && ${#media_files[@]} -gt 0 ]]; then
      cover="${media_files[0]}"
    fi

    if [[ -z "$cover" ]]; then
      continue
    fi

    rel_cover="${cover#$ROOT_DIR/}"

    if [[ $first_proj -eq 1 ]]; then
      printf '\n'
      first_proj=0
    else
      printf ',\n'
    fi

    printf '    {\n'
    printf '      "id": "%s/%s",\n' "$(json_escape "$cat_slug")" "$(json_escape "$proj_slug")"
    printf '      "category": "%s",\n' "$(json_escape "$cat_slug")"
    printf '      "title": "%s",\n' "$(json_escape "$title")"
    printf '      "date": "%s",\n' "$(json_escape "$date_text")"
    printf '      "chip": "%s",\n' "$(json_escape "$chip")"
    printf '      "cover": "%s",\n' "$(json_escape "$rel_cover")"
    printf '      "client": "%s",\n' "$(json_escape "$client")"
    printf '      "project": "%s",\n' "$(json_escape "$project_type")"
    printf '      "brand_model": "%s",\n' "$(json_escape "$brand_model")"
    printf '      "agency": "%s",\n' "$(json_escape "$agency")"
    printf '      "description": "%s",\n' "$(json_escape "$description")"
    printf '      "media": ['

    first_media=1
    for file in "${media_files[@]:-}"; do
      rel_file="${file#$ROOT_DIR/}"
      ext="${file##*.}"
      lower_ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
      media_type="image"
      case "$lower_ext" in
        mp4|mov|webm|m4v) media_type="video" ;;
      esac

      if [[ $first_media -eq 1 ]]; then
        printf '\n'
        first_media=0
      else
        printf ',\n'
      fi
      printf '        {"type":"%s","src":"%s"}' \
        "$(json_escape "$media_type")" \
        "$(json_escape "$rel_file")"
    done

    if [[ $first_media -eq 0 ]]; then
      printf '\n'
    fi
    printf '      ]\n'
    printf '    }'
  done

  if [[ $first_proj -eq 0 ]]; then
    printf '\n'
  fi
  printf '  ]\n'
  printf '}\n'
} > "$OUT_FILE"

printf 'Generated %s\n' "$OUT_FILE"
