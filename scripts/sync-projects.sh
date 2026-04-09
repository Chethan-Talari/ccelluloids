#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="$ROOT_DIR/assets/projects"
OUT_FILE="$PROJECTS_DIR/projects.json"
ORDER_FILE="$PROJECTS_DIR/order.txt"

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

trim_text() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

array_contains() {
  local needle="$1"
  shift || true
  local item
  for item in "$@"; do
    if [[ "$item" == "$needle" ]]; then
      return 0
    fi
  done
  return 1
}

find_project_dir() {
  local category="$1"
  local project="$2"
  local dir
  for dir in "${project_dirs[@]:-}"; do
    if [[ "$(basename "$(dirname "$dir")")" == "$category" && "$(basename "$dir")" == "$project" ]]; then
      printf '%s' "$dir"
      return 0
    fi
  done
  return 1
}

read_order_file() {
  ordered_categories=()
  ordered_projects=()

  local current_section=""
  local raw_line line
  if [[ ! -f "$ORDER_FILE" ]]; then
    return
  fi

  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    line="$(trim_text "${raw_line%%#*}")"
    [[ -n "$line" ]] || continue

    if [[ "$line" == \[*\] ]]; then
      current_section="${line#[}"
      current_section="${current_section%]}"
      current_section="$(trim_text "$current_section")"
      continue
    fi

    if [[ -z "$current_section" ]]; then
      ordered_categories+=("$line")
    else
      ordered_projects+=("$current_section|$line")
    fi
  done < "$ORDER_FILE"
}

project_dirs=()
categories_seen=()

while IFS= read -r cat_slug; do
  [[ -n "$cat_slug" ]] || continue
  [[ -d "$PROJECTS_DIR/$cat_slug" ]] || continue
  categories_seen+=("$cat_slug")

  while IFS= read -r proj_slug; do
    [[ -n "$proj_slug" ]] || continue
    [[ -d "$PROJECTS_DIR/$cat_slug/$proj_slug" ]] || continue
    project_dirs+=("$PROJECTS_DIR/$cat_slug/$proj_slug")
  done < <(LC_ALL=C ls -1U "$PROJECTS_DIR/$cat_slug")
done < <(LC_ALL=C ls -1U "$PROJECTS_DIR")

# Keep only categories that actually contain at least one project directory.
filtered_categories=()
for cat_slug in "${categories_seen[@]:-}"; do
  for dir in "${project_dirs[@]:-}"; do
    if [[ "$(basename "$(dirname "$dir")")" == "$cat_slug" ]]; then
      filtered_categories+=("$cat_slug")
      break
    fi
  done
done
categories_seen=("${filtered_categories[@]:-}")

ordered_categories=()
ordered_projects=()
read_order_file

if [[ ${#ordered_categories[@]} -gt 0 ]]; then
  sorted_categories=()
  for cat_slug in "${ordered_categories[@]:-}"; do
    if array_contains "$cat_slug" "${categories_seen[@]:-}" && ! array_contains "$cat_slug" "${sorted_categories[@]:-}"; then
      sorted_categories+=("$cat_slug")
    fi
  done

  for cat_slug in "${categories_seen[@]:-}"; do
    if ! array_contains "$cat_slug" "${sorted_categories[@]:-}"; then
      sorted_categories+=("$cat_slug")
    fi
  done
  categories_seen=("${sorted_categories[@]:-}")
fi

sorted_project_dirs=()
for cat_slug in "${categories_seen[@]:-}"; do
  listed_projects=()

  for entry in "${ordered_projects[@]:-}"; do
    entry_cat="${entry%%|*}"
    entry_project="${entry#*|}"
    if [[ "$entry_cat" == "$cat_slug" ]]; then
      if project_dir="$(find_project_dir "$cat_slug" "$entry_project")"; then
        if ! array_contains "$project_dir" "${sorted_project_dirs[@]:-}"; then
          sorted_project_dirs+=("$project_dir")
          listed_projects+=("$entry_project")
        fi
      fi
    fi
  done

  for project_dir in "${project_dirs[@]:-}"; do
    if [[ "$(basename "$(dirname "$project_dir")")" == "$cat_slug" ]] && ! array_contains "$project_dir" "${sorted_project_dirs[@]:-}"; then
      sorted_project_dirs+=("$project_dir")
    fi
  done
done
project_dirs=("${sorted_project_dirs[@]:-}")

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
    featured="false"
    hero_position="50% 50%"

    if value="$(read_meta_value "$meta_file" "title" 2>/dev/null)"; then title="$value"; fi
    if value="$(read_meta_value "$meta_file" "chip" 2>/dev/null)"; then chip="$value"; fi
    if value="$(read_meta_value "$meta_file" "description" 2>/dev/null)"; then description="$value"; fi
    if value="$(read_meta_value "$meta_file" "client" 2>/dev/null)"; then client="$value"; fi
    if value="$(read_meta_value "$meta_file" "project" 2>/dev/null)"; then project_type="$value"; fi
    if value="$(read_meta_value "$meta_file" "brand_model" 2>/dev/null)"; then brand_model="$value"; fi
    if value="$(read_meta_value "$meta_file" "agency" 2>/dev/null)"; then agency="$value"; fi
    if value="$(read_meta_value "$meta_file" "date" 2>/dev/null)"; then date_text="$value"; fi
    if value="$(read_meta_value "$meta_file" "hero_position" 2>/dev/null)"; then hero_position="$value"; fi
    if value="$(read_meta_value "$meta_file" "featured" 2>/dev/null)"; then
      case "$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')" in
        true|yes|1) featured="true" ;;
        *) featured="false" ;;
      esac
    fi

    cover=""
    while IFS= read -r cover_file; do
      cover="$cover_file"
      break
    done < <(
      find "$project_dir" -mindepth 1 -maxdepth 1 -type f \
        \( -iname "cover.jpg" -o -iname "cover.jpeg" -o -iname "cover.png" -o -iname "cover.webp" -o -iname "cover.avif" \) \
        | sort -f
    )

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
    cover_preview="assets/optimized/projects/$cat_slug/$proj_slug/cover.jpg"

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
    if [[ -f "$ROOT_DIR/$cover_preview" ]]; then
      printf '      "cover_preview": "%s",\n' "$(json_escape "$cover_preview")"
    fi
    printf '      "client": "%s",\n' "$(json_escape "$client")"
    printf '      "project": "%s",\n' "$(json_escape "$project_type")"
    printf '      "brand_model": "%s",\n' "$(json_escape "$brand_model")"
    printf '      "agency": "%s",\n' "$(json_escape "$agency")"
    printf '      "hero_position": "%s",\n' "$(json_escape "$hero_position")"
    printf '      "featured": %s,\n' "$featured"
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
