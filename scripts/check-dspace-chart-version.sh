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
documented_chart_version=$(awk '!/^[[:space:]]*#/ && NF { sub(/\r$/, ""); print; exit }' "$version_file")
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

semver_is_greater() {
  node -e '
const [current, previous] = process.argv.slice(1).map((version) => version.split(".").map(Number));
for (let index = 0; index < 3; index += 1) {
  if (current[index] !== previous[index]) process.exit(current[index] > previous[index] ? 0 : 1);
}
process.exit(1);
' "$1" "$2"
}

expect_present "root package version" "$root_package_version"
expect_semver "root package version" "$root_package_version"
for coordinate in \
  "frontend package version:$frontend_package_version" \
  "package-lock top-level version:$package_lock_version" \
  'package-lock packages[""].version:'"$package_lock_root_version" \
  "chart appVersion:$chart_app_version"; do
  label=${coordinate%%:*}
  actual=${coordinate#*:}
  expect_semver "$label" "$actual"
  expect_equal "Application" "$label" "$actual" "$root_package_version"
done
expect_equal "Application" "chart default image.tag" "$image_tag" "$expected_image_tag"

expect_present "chart version" "$chart_version"
expect_semver "chart version" "$chart_version"
expect_semver "docs/apps/dspace.version" "$documented_chart_version"
expect_equal "Chart" "docs/apps/dspace.version" "$documented_chart_version" "$chart_version"

# Publishing changed application metadata inside an existing chart coordinate would mutate an
# already-addressed OCI artifact. CI supplies the previous revision so independent application and
# chart versions remain allowed, while an application bump also requires a new chart version.
if [[ -n "${DSPACE_VERSION_BASE_REF:-}" ]]; then
  previous_root_package=$(git -C "$repo_root" show "${DSPACE_VERSION_BASE_REF}:package.json" 2>/dev/null) || {
    echo "Unable to read application coordinates from base revision '$DSPACE_VERSION_BASE_REF'" >&2
    exit 1
  }
  previous_chart=$(git -C "$repo_root" show "${DSPACE_VERSION_BASE_REF}:charts/dspace/Chart.yaml" 2>/dev/null) || {
    echo "Unable to read chart coordinates from base revision '$DSPACE_VERSION_BASE_REF'" >&2
    exit 1
  }
  previous_app_version=$(node -e 'const fs = require("node:fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).version || "")' <<<"$previous_root_package")
  previous_chart_version=$(awk '$1 == "version:" { value = $2; gsub(/^"|"$/, "", value); print value; exit }' <<<"$previous_chart")

  if [[ "$root_package_version" != "$previous_app_version" ]]; then
    if [[ "$chart_version" == "$previous_chart_version" ]]; then
      echo "Chart coordinate reuse: application version changed from '$previous_app_version' to '$root_package_version', but chart version remains '$chart_version'" >&2
      failures=$((failures + 1))
    elif ! semver_is_greater "$chart_version" "$previous_chart_version"; then
      echo "Chart version must advance when application metadata changes; found '$chart_version' after '$previous_chart_version'" >&2
      failures=$((failures + 1))
    fi
  fi
fi

if (( failures > 0 )); then
  echo "DSPACE release coordinate groups are not aligned." >&2
  exit 1
fi

echo "DSPACE release coordinates are aligned: application version ${root_package_version} (${expected_image_tag}); chart version ${chart_version}."
