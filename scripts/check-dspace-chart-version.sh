#!/usr/bin/env bash
set -euo pipefail

repo_root="${DSPACE_VERSION_ROOT:-$(pwd)}"
package_file="$repo_root/package.json"
frontend_package_file="$repo_root/frontend/package.json"
lock_file="$repo_root/package-lock.json"
chart_file="$repo_root/charts/dspace/Chart.yaml"
values_file="$repo_root/charts/dspace/values.yaml"
version_file="$repo_root/docs/apps/dspace.version"

for required_file in \
  "$package_file" \
  "$frontend_package_file" \
  "$lock_file" \
  "$chart_file" \
  "$values_file" \
  "$version_file"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Required version coordinate file not found: $required_file" >&2
    exit 1
  fi
done

read_json_field() {
  local file="$1"
  local expression="$2"
  node -e "const data = require(process.argv[1]); const value = $expression; if (typeof value !== 'string' || value.length === 0) process.exit(2); console.log(value);" "$file"
}

root_version=$(read_json_field "$package_file" 'data.version')
frontend_version=$(read_json_field "$frontend_package_file" 'data.version')
lock_version=$(read_json_field "$lock_file" 'data.version')
lock_root_version=$(read_json_field "$lock_file" 'data.packages && data.packages[""] && data.packages[""].version')
chart_version=$(sed -nE 's/^version:[[:space:]]*"?([^"[:space:]]+)"?[[:space:]]*$/\1/p' "$chart_file" | head -n1)
chart_app_version=$(sed -nE 's/^appVersion:[[:space:]]*"?([^"[:space:]]+)"?[[:space:]]*$/\1/p' "$chart_file" | head -n1)
image_tag=$(sed -nE 's/^[[:space:]]+tag:[[:space:]]*"?([^"[:space:]]+)"?[[:space:]]*$/\1/p' "$values_file" | head -n1)
version_line=$(grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' "$version_file" | head -n1)

failures=0
check_equal() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ -z "$actual" ]]; then
    echo "Missing $label; expected '$expected'" >&2
    failures=$((failures + 1))
  elif [[ "$actual" != "$expected" ]]; then
    echo "$label mismatch: expected '$expected' but found '$actual'" >&2
    failures=$((failures + 1))
  fi
}

check_equal "frontend package version" "$frontend_version" "$root_version"
check_equal "package-lock top-level version" "$lock_version" "$root_version"
check_equal 'package-lock packages[""].version' "$lock_root_version" "$root_version"
check_equal "chart version" "$chart_version" "$root_version"
check_equal "chart appVersion" "$chart_app_version" "$root_version"
check_equal "chart default image.tag" "$image_tag" "v$root_version"
check_equal "docs/apps/dspace.version" "$version_line" "$root_version"

if [[ "$failures" -gt 0 ]]; then
  echo "DSPACE release coordinates are not aligned with package version '$root_version'." >&2
  exit 1
fi

echo "DSPACE release coordinates are aligned at $root_version (image tag v$root_version)."
