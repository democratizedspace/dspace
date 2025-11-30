#!/usr/bin/env bash
set -euo pipefail

chart_version=$(awk '/^version:/ {print $2; exit}' charts/dspace/Chart.yaml)
version_file="docs/apps/dspace.version"

if [ ! -f "${version_file}" ]; then
  echo "Missing ${version_file}." >&2
  exit 1
fi

file_version=$(awk '!/^[[:space:]]*#/ && NF {print $1; exit}' "${version_file}")

if [ -z "${file_version}" ]; then
  echo "No version entry found in ${version_file}." >&2
  exit 1
fi

if [ "${chart_version}" != "${file_version}" ]; then
  echo "Version mismatch: Chart.yaml=${chart_version} vs ${version_file}=${file_version}." >&2
  exit 1
fi

echo "Chart version ${chart_version} matches ${version_file}."
