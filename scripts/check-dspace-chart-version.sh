#!/usr/bin/env bash
set -euo pipefail

chart_file="charts/dspace/Chart.yaml"
version_file="docs/apps/dspace.version"

if [[ ! -f "$chart_file" ]]; then
  echo "Chart file not found: $chart_file" >&2
  exit 1
fi

if [[ ! -f "$version_file" ]]; then
  echo "Version file not found: $version_file" >&2
  exit 1
fi

chart_version=$(awk -F': *' '$1 == "version" {print $2}' "$chart_file" | head -n1)
version_line=$(grep -E '^[0-9]+\.[0-9]+\.[0-9]+' "$version_file" | head -n1)

if [[ -z "$chart_version" ]]; then
  echo "Unable to read chart version from $chart_file" >&2
  exit 1
fi

if [[ -z "$version_line" ]]; then
  echo "No semantic version found in $version_file" >&2
  exit 1
fi

if [[ "$chart_version" != "$version_line" ]]; then
  echo "Chart version mismatch: Chart.yaml has '$chart_version' but $version_file has '$version_line'" >&2
  exit 1
fi

echo "Chart version is in sync: $chart_version"
