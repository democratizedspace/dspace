#!/usr/bin/env bash
set -euo pipefail

repo_root="${DSPACE_VERSION_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
root_package_file="$repo_root/package.json"
frontend_package_file="$repo_root/frontend/package.json"
package_lock_file="$repo_root/package-lock.json"
chart_file="$repo_root/charts/dspace/Chart.yaml"
values_file="$repo_root/charts/dspace/values.yaml"
version_file="$repo_root/docs/apps/dspace.version"

require_file() {
  local group="$1"
  local field="$2"
  local file="$3"
  if [[ ! -f "$file" ]]; then
    echo "$group coordinate missing: $field file not found: $file" >&2
    exit 1
  fi
}

json_get() {
  local file="$1"
  local expr="$2"
  node -e '
const fs = require("node:fs");
const [file, expr] = process.argv.slice(1);
let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  console.error(`Unable to read or parse JSON coordinate file ${file}: ${error.message}`);
  process.exit(2);
}
const value = expr.split(".").reduce((current, key) => current?.[key], data);
console.log(typeof value === "string" && value.length > 0 ? value : "");
' "$file" "$expr"
}

yaml_scalar() {
  local file="$1"
  local key="$2"
  awk -v key="$key" '
    $1 == key ":" {
      value = $2
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "$file"
}

yaml_nested_scalar() {
  local file="$1"
  local parent="$2"
  local key="$3"
  awk -v parent="$parent" -v key="$key" '
    $1 == parent ":" { in_parent = 1; next }
    in_parent && $0 !~ /^#/ && $0 !~ /^[[:space:]]/ { exit }
    in_parent && $1 == key ":" {
      value = $2
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "$file"
}

require_file "Application" "root package version" "$root_package_file"
require_file "Application" "frontend package version" "$frontend_package_file"
require_file "Application" "package-lock versions" "$package_lock_file"
require_file "Application" "chart appVersion" "$chart_file"
require_file "Application" "chart default image.tag" "$values_file"
require_file "Chart" "docs/apps/dspace.version" "$version_file"

root_package_version=$(json_get "$root_package_file" version)
frontend_package_version=$(json_get "$frontend_package_file" version)
package_lock_version=$(json_get "$package_lock_file" version)
package_lock_root_version=$(json_get "$package_lock_file" 'packages..version')
chart_version=$(yaml_scalar "$chart_file" version || true)
chart_app_version=$(yaml_scalar "$chart_file" appVersion || true)
image_tag=$(yaml_nested_scalar "$values_file" image tag || true)
expected_image_tag="main-1a31a56"

mapfile -t documented_chart_lines < <(awk '!/^[[:space:]]*#/ && NF { print }' "$version_file")
documented_chart_version=""
if (( ${#documented_chart_lines[@]} == 1 )); then
  documented_chart_version=${documented_chart_lines[0]}
fi

failures=0
expect_present() {
  local group="$1"
  local label="$2"
  local actual="$3"
  if [[ -z "$actual" ]]; then
    echo "$group coordinate missing: $label; expected a non-empty value" >&2
    failures=$((failures + 1))
  fi
}

expect_semver() {
  local group="$1"
  local label="$2"
  local actual="$3"
  if [[ -n "$actual" && ! "$actual" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
    echo "$group coordinate malformed: $label must be bare X.Y.Z SemVer; found '$actual'" >&2
    failures=$((failures + 1))
  fi
}

expect_equal() {
  local group="$1"
  local label="$2"
  local actual="$3"
  local expected="$4"
  if [[ -z "$actual" ]]; then
    echo "$group coordinate drift: missing $label; expected '$expected'" >&2
    failures=$((failures + 1))
  elif [[ "$actual" != "$expected" ]]; then
    echo "$group coordinate drift: $label found '$actual', expected '$expected'" >&2
    failures=$((failures + 1))
  fi
}

expect_present "Application" "root package version" "$root_package_version"
expect_semver "Application" "root package version" "$root_package_version"
for coordinate in \
  "frontend package version:$frontend_package_version" \
  "package-lock top-level version:$package_lock_version" \
  'package-lock packages[""].version:'"$package_lock_root_version" \
  "chart appVersion:$chart_app_version"; do
  label=${coordinate%%:*}
  actual=${coordinate#*:}
  expect_semver "Application" "$label" "$actual"
  expect_equal "Application" "$label" "$actual" "$root_package_version"
done
expect_equal "Application" "chart default image.tag" "$image_tag" "$expected_image_tag"

expect_present "Chart" "chart version" "$chart_version"
expect_semver "Chart" "chart version" "$chart_version"
if (( ${#documented_chart_lines[@]} != 1 )); then
  echo "Chart coordinate malformed: docs/apps/dspace.version must contain exactly one non-empty, non-comment line; found ${#documented_chart_lines[@]}" >&2
  failures=$((failures + 1))
else
  expect_semver "Chart" "docs/apps/dspace.version" "$documented_chart_version"
fi
expect_equal "Chart" "docs/apps/dspace.version" "$documented_chart_version" "$chart_version"

if (( failures > 0 )); then
  echo "DSPACE release coordinate groups are not aligned." >&2
  exit 1
fi

echo "DSPACE release coordinates are aligned: application version ${root_package_version} (${expected_image_tag}); chart version ${chart_version}."
