#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';

export const SOURCE_REPOSITORY = 'https://github.com/democratizedspace/dspace';
export const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export const FULL_REVISION = /^[0-9a-f]{40}$/;

function requireValue(value, label, pattern) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`Invalid ${label}: expected ${pattern}`);
  }
  return value;
}

export function readChartMetadata(chartYaml) {
  const chart = parse(chartYaml);
  if (!chart || typeof chart !== 'object' || Array.isArray(chart)) {
    throw new Error('Chart metadata must be a YAML mapping');
  }
  requireValue(chart.version, 'chart version', STRICT_SEMVER);
  requireValue(chart.appVersion, 'chart appVersion', STRICT_SEMVER);
  return chart;
}

export function stampChartMetadata(chartYaml, revision) {
  requireValue(revision, 'full source revision', FULL_REVISION);
  const chart = readChartMetadata(chartYaml);
  chart.annotations = {
    ...(chart.annotations && typeof chart.annotations === 'object'
      ? chart.annotations
      : {}),
    'org.opencontainers.image.source': SOURCE_REPOSITORY,
    'org.opencontainers.image.revision': revision,
    'org.opencontainers.image.version': chart.appVersion,
  };
  return stringify(chart, { lineWidth: 0 });
}

export function verifyChartProvenance(
  chartYaml,
  { version, appVersion, revision }
) {
  requireValue(version, 'expected chart version', STRICT_SEMVER);
  requireValue(appVersion, 'expected appVersion', STRICT_SEMVER);
  requireValue(revision, 'full source revision', FULL_REVISION);
  const chart = readChartMetadata(chartYaml);
  const expected = {
    version,
    appVersion,
    source: SOURCE_REPOSITORY,
    revision,
  };
  const actual = {
    version: chart.version,
    appVersion: chart.appVersion,
    source: chart.annotations?.['org.opencontainers.image.source'],
    revision: chart.annotations?.['org.opencontainers.image.revision'],
  };
  if (chart.annotations?.['org.opencontainers.image.version'] !== appVersion) {
    throw new Error(
      'Packaged chart application-version annotation does not match'
    );
  }
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key])
      throw new Error(`Packaged chart ${key} does not match`);
  }
  return chart;
}

function args(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    if (!flag?.startsWith('--') || !rest[index + 1])
      throw new Error(`Invalid argument: ${flag}`);
    values[flag.slice(2)] = rest[index + 1];
  }
  return { command, values };
}

export function main(argv = process.argv.slice(2)) {
  const { command, values } = args(argv);
  if (command === 'stage') {
    if (!values.source || !values.destination)
      throw new Error('stage requires --source and --destination');
    const sourceYaml = readFileSync(join(values.source, 'Chart.yaml'), 'utf8');
    readChartMetadata(sourceYaml);
    mkdirSync(dirname(values.destination), { recursive: true });
    cpSync(values.source, values.destination, { recursive: true });
    writeFileSync(
      join(values.destination, 'Chart.yaml'),
      stampChartMetadata(sourceYaml, values.revision)
    );
    return;
  }
  if (command === 'verify') {
    verifyChartProvenance(readFileSync(0, 'utf8'), {
      version: values.version,
      appVersion: values['app-version'],
      revision: values.revision,
    });
    return;
  }
  throw new Error('Usage: helm-chart-provenance.mjs <stage|verify> ...');
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error?.message || error);
    process.exit(1);
  }
}
