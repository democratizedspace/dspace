#!/usr/bin/env bash
set -euo pipefail

package_file="${DSPACE_PACKAGE_FILE:-package.json}"
frontend_package_file="${DSPACE_FRONTEND_PACKAGE_FILE:-frontend/package.json}"
package_lock_file="${DSPACE_PACKAGE_LOCK_FILE:-package-lock.json}"
chart_file="${DSPACE_CHART_FILE:-charts/dspace/Chart.yaml}"
values_file="${DSPACE_VALUES_FILE:-charts/dspace/values.yaml}"
version_file="${DSPACE_VERSION_FILE:-docs/apps/dspace.version}"

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Required file not found: $1" >&2
    exit 1
  fi
}

json_expr() {
  local file="$1"
  local expr="$2"
  node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); const value = ${expr}; if (typeof value !== 'string' || value.length === 0) process.exit(1); process.stdout.write(value);" "$file"
}

yaml_value() {
  local file="$1"
  local key="$2"
  sed -n "s/^[[:space:]]*${key}:[[:space:]]*//p" "$file" | head -n1 | sed 's/^"//; s/"$//; s/^'"'"'//; s/'"'"'$//'
}

for file in "$package_file" "$frontend_package_file" "$package_lock_file" "$chart_file" "$values_file" "$version_file"; do
  require_file "$file"
done

package_version=$(json_expr "$package_file" 'data.version')
frontend_package_version=$(json_expr "$frontend_package_file" 'data.version')
lock_version=$(json_expr "$package_lock_file" 'data.version')
lock_root_version=$(json_expr "$package_lock_file" 'data.packages && data.packages[""] && data.packages[""].version')
chart_version=$(yaml_value "$chart_file" 'version')
chart_app_version=$(yaml_value "$chart_file" 'appVersion')
image_tag=$(awk '
  /^image:[[:space:]]*$/ { in_image=1; next }
  in_image && /^[^[:space:]]/ { in_image=0 }
  in_image && /^[[:space:]]*tag:[[:space:]]*/ { sub(/^[[:space:]]*tag:[[:space:]]*/, ""); gsub(/^"|"$/, ""); gsub(/^'"'"'|'"'"'$/, ""); print; exit }
' "$values_file")
version_line=$(grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' "$version_file" | head -n1)
expected_image_tag="v${package_version}"

mismatches=0
check_equal() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ -z "$actual" ]]; then
    echo "Version coordinate missing: ${label}" >&2
    mismatches=$((mismatches + 1))
  elif [[ "$actual" != "$expected" ]]; then
    echo "Version coordinate mismatch: ${label} is '${actual}', expected '${expected}'" >&2
    mismatches=$((mismatches + 1))
  fi
}

check_equal "frontend package version" "$frontend_package_version" "$package_version"
check_equal "package-lock top-level version" "$lock_version" "$package_version"
check_equal 'package-lock packages[""].version' "$lock_root_version" "$package_version"
check_equal "chart version" "$chart_version" "$package_version"
check_equal "chart appVersion" "$chart_app_version" "$package_version"
check_equal "chart default image.tag" "$image_tag" "$expected_image_tag"
check_equal "docs/apps/dspace.version" "$version_line" "$package_version"

if [[ "$mismatches" -ne 0 ]]; then
  echo "DSPACE release coordinates are not aligned with package version ${package_version}." >&2
  exit 1
fi

echo "DSPACE release coordinates are aligned: ${package_version} (image tag ${expected_image_tag})"
