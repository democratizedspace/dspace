#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';

export const SOURCE_REPOSITORY = 'https://github.com/democratizedspace/dspace';
const FULL_SHA = /^[0-9a-f]{40}$/;
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+$/;

function required(value, label, pattern) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`Invalid ${label}: expected ${pattern}`);
  }
  return value;
}

export function stageChart({ sourceDir, destinationDir, revision }) {
  if (!sourceDir || !destinationDir || sourceDir === destinationDir) {
    throw new Error(
      'Distinct sourceDir and destinationDir values are required'
    );
  }
  required(revision, 'full source revision', FULL_SHA);
  const sourceYaml = join(sourceDir, 'Chart.yaml');
  const chart = parse(readFileSync(sourceYaml, 'utf8'));
  if (!chart || typeof chart !== 'object')
    throw new Error('Chart.yaml must contain a YAML map');
  required(chart.version, 'chart version', SEMVER);
  required(String(chart.appVersion), 'appVersion', SEMVER);

  mkdirSync(dirname(destinationDir), { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true, errorOnExist: true });
  chart.annotations = { ...(chart.annotations || {}) };
  chart.annotations['org.opencontainers.image.source'] = SOURCE_REPOSITORY;
  chart.annotations['org.opencontainers.image.revision'] = revision;
  chart.annotations['org.opencontainers.image.version'] = String(
    chart.appVersion
  );
  writeFileSync(join(destinationDir, 'Chart.yaml'), stringify(chart));
  return {
    version: chart.version,
    appVersion: String(chart.appVersion),
    source: SOURCE_REPOSITORY,
  };
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length !== 3) {
    throw new Error(
      'Usage: stage-helm-chart.mjs <source-dir> <destination-dir> <full-revision>'
    );
  }
  const result = stageChart({
    sourceDir: argv[0],
    destinationDir: argv[1],
    revision: argv[2],
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
