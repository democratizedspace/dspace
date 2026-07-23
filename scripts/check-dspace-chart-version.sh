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
  if [[ ! -f "$1" ]]; then
    echo "Required version coordinate file not found: $1" >&2
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

for file in "$root_package_file" "$frontend_package_file" "$package_lock_file" "$chart_file" "$values_file" "$version_file"; do
  require_file "$file"
done

root_package_version=$(json_get "$root_package_file" version)
frontend_package_version=$(json_get "$frontend_package_file" version)
package_lock_version=$(json_get "$package_lock_file" version)
package_lock_root_version=$(json_get "$package_lock_file" 'packages..version')
chart_version=$(yaml_scalar "$chart_file" version || true)
chart_app_version=$(yaml_scalar "$chart_file" appVersion || true)
image_tag=$(yaml_nested_scalar "$values_file" image tag || true)
version_line=$(grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' "$version_file" | head -n1 || true)
expected_image_tag="v${root_package_version}"

failures=0
expect_present() {
  local label="$1"
  local actual="$2"
  if [[ -z "$actual" ]]; then
    echo "Missing $label; expected a non-empty value" >&2
    failures=$((failures + 1))
  fi
}

expect_semver() {
  local label="$1"
  local actual="$2"
  if [[ -n "$actual" && ! "$actual" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "$label must be a semantic version like 3.1.0; found '$actual'" >&2
    failures=$((failures + 1))
  fi
}

expect_equal() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ -z "$actual" ]]; then
    echo "Missing $label; expected '$expected'" >&2
    failures=$((failures + 1))
  elif [[ "$actual" != "$expected" ]]; then
    echo "$label mismatch: found '$actual', expected '$expected'" >&2
    failures=$((failures + 1))
  fi
}

expect_present "root package version" "$root_package_version"
expect_semver "root package version" "$root_package_version"
expect_equal "frontend package version" "$frontend_package_version" "$root_package_version"
expect_equal "package-lock top-level version" "$package_lock_version" "$root_package_version"
expect_equal 'package-lock packages[""].version' "$package_lock_root_version" "$root_package_version"
expect_equal "chart version" "$chart_version" "$root_package_version"
expect_equal "chart appVersion" "$chart_app_version" "$root_package_version"
expect_equal "chart default image.tag" "$image_tag" "$expected_image_tag"
expect_equal "docs/apps/dspace.version" "$version_line" "$root_package_version"

if (( failures > 0 )); then
  echo "DSPACE release coordinates are not aligned." >&2
  exit 1
fi

echo "DSPACE release coordinates are aligned at ${root_package_version} (${expected_image_tag})."
