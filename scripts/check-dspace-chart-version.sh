#!/usr/bin/env bash
set -euo pipefail

root_package_file="package.json"
frontend_package_file="frontend/package.json"
lock_file="package-lock.json"
chart_file="charts/dspace/Chart.yaml"
values_file="charts/dspace/values.yaml"
version_file="docs/apps/dspace.version"

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Version coordinate file not found: $1" >&2
    exit 1
  fi
}

json_field() {
  local file="$1"
  local expr="$2"
  node -e "const data=require('./${file}'); const value=${expr}; if (!value) process.exit(1); console.log(value);"
}

yaml_scalar() {
  local key="$1"
  local file="$2"
  sed -n -E "s/^${key}:[[:space:]]*\"?([^\"]*)\"?[[:space:]]*$/\1/p" "$file" | head -n1
}

for file in "$root_package_file" "$frontend_package_file" "$lock_file" "$chart_file" "$values_file" "$version_file"; do
  require_file "$file"
done

root_version=$(json_field "$root_package_file" "data.version")
frontend_version=$(json_field "$frontend_package_file" "data.version")
lock_version=$(json_field "$lock_file" "data.version")
lock_package_version=$(json_field "$lock_file" "data.packages && data.packages[''] && data.packages[''].version")
chart_version=$(yaml_scalar version "$chart_file")
chart_app_version=$(yaml_scalar appVersion "$chart_file")
image_tag=$(awk '
  /^image:/ { in_image=1; next }
  in_image && /^[^[:space:]]/ { in_image=0 }
  in_image && /^[[:space:]]+tag:/ { gsub(/"/, "", $2); print $2; exit }
' "$values_file")
version_line=$(grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' "$version_file" | head -n1)
expected_image_tag="v${root_version}"

failures=0
check_equal() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ -z "$actual" ]]; then
    echo "Missing version coordinate: ${label}" >&2
    failures=$((failures + 1))
  elif [[ "$actual" != "$expected" ]]; then
    echo "Version coordinate mismatch: ${label} is '${actual}' but expected '${expected}'" >&2
    failures=$((failures + 1))
  fi
}

check_equal "frontend package version" "$frontend_version" "$root_version"
check_equal "package-lock top-level version" "$lock_version" "$root_version"
check_equal "package-lock packages[\"\"].version" "$lock_package_version" "$root_version"
check_equal "charts/dspace Chart.yaml version" "$chart_version" "$root_version"
check_equal "charts/dspace Chart.yaml appVersion" "$chart_app_version" "$root_version"
check_equal "charts/dspace values.yaml image.tag" "$image_tag" "$expected_image_tag"
check_equal "docs/apps/dspace.version" "$version_line" "$root_version"

if [[ "$failures" -gt 0 ]]; then
  exit 1
fi

echo "DSPACE release coordinates are aligned at ${root_version} (image tag ${expected_image_tag})."
