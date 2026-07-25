#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parse, stringify } from 'yaml';

export const SOURCE_REPOSITORY = 'https://github.com/democratizedspace/dspace';
export const TOMBSTONED_CHART_VERSION = '3.0.1';
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const REVISION = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;

function requireMatch(value, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`${label} is invalid: ${value || '<empty>'}`);
  }
  return value;
}

export function validateChartRelease({
  chartVersion,
  appVersion,
  chartTag,
  revision,
}) {
  requireMatch(chartVersion, SEMVER, 'chart version');
  requireMatch(appVersion, SEMVER, 'appVersion');
  requireMatch(revision, REVISION, 'source revision');
  if (chartVersion === TOMBSTONED_CHART_VERSION) {
    throw new Error(
      `Chart version ${TOMBSTONED_CHART_VERSION} is permanently tombstoned`
    );
  }
  if (chartTag !== `chart-v${chartVersion}`) {
    throw new Error(`chart tag must equal chart-v${chartVersion}`);
  }
  return { chartVersion, appVersion, chartTag, revision };
}

export function readChart(chartPath) {
  const chart = parse(readFileSync(chartPath, 'utf8'));
  if (!chart || typeof chart !== 'object' || Array.isArray(chart)) {
    throw new Error('Chart.yaml must contain a YAML mapping');
  }
  return chart;
}

export function stageChart({ sourceDir, stagedDir, chartTag, revision }) {
  const sourceChartPath = `${sourceDir}/Chart.yaml`;
  const original = readFileSync(sourceChartPath, 'utf8');
  const chart = readChart(sourceChartPath);
  validateChartRelease({
    chartVersion: chart.version,
    appVersion: String(chart.appVersion),
    chartTag,
    revision,
  });
  cpSync(sourceDir, stagedDir, { recursive: true, errorOnExist: true });
  chart.annotations = {
    ...(chart.annotations || {}),
    'org.opencontainers.image.source': SOURCE_REPOSITORY,
    'org.opencontainers.image.revision': revision,
    'org.opencontainers.image.version': String(chart.appVersion),
  };
  writeFileSync(`${stagedDir}/Chart.yaml`, stringify(chart));
  if (readFileSync(sourceChartPath, 'utf8') !== original) {
    throw new Error('Source Chart.yaml was mutated while staging');
  }
  return { chartVersion: chart.version, appVersion: String(chart.appVersion) };
}

export function validateDigest(value, label) {
  return requireMatch(value, DIGEST, label);
}

export function verifyPackage({ archive, chartVersion, appVersion, revision }) {
  if (!existsSync(archive))
    throw new Error(`Expected chart archive does not exist: ${archive}`);
  const shown = spawnSync('helm', ['show', 'chart', archive], {
    encoding: 'utf8',
  });
  if (shown.status !== 0)
    throw new Error(`helm show chart failed: ${shown.stderr.trim()}`);
  const chart = parse(shown.stdout);
  const expectedAnnotations = {
    'org.opencontainers.image.source': SOURCE_REPOSITORY,
    'org.opencontainers.image.revision': revision,
    'org.opencontainers.image.version': appVersion,
  };
  if (
    chart.version !== chartVersion ||
    String(chart.appVersion) !== appVersion
  ) {
    throw new Error(
      'Packaged chart coordinates do not match the validated source chart'
    );
  }
  for (const [key, value] of Object.entries(expectedAnnotations)) {
    if (chart.annotations?.[key] !== value)
      throw new Error(`Packaged annotation ${key} is invalid`);
  }
  return chart;
}

function output(entries) {
  const body =
    Object.entries(entries)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT)
    writeFileSync(process.env.GITHUB_OUTPUT, body, { flag: 'a' });
  else process.stdout.write(body);
}

export function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (command === 'stage') {
    const chartTag = process.env.CHART_TAG || '';
    const revision = process.env.SOURCE_REVISION || '';
    const sourceDir = process.env.CHART_SOURCE_DIR || 'charts/dspace';
    const stagedDir = process.env.CHART_STAGED_DIR || '';
    if (!stagedDir) throw new Error('CHART_STAGED_DIR is required');
    const coordinates = stageChart({
      sourceDir,
      stagedDir,
      chartTag,
      revision,
    });
    output({ ...coordinates, chartTag, revision });
    return;
  }
  if (command === 'verify-package') {
    verifyPackage({
      archive: process.env.CHART_ARCHIVE || '',
      chartVersion: process.env.CHART_VERSION || '',
      appVersion: process.env.APP_VERSION || '',
      revision: process.env.SOURCE_REVISION || '',
    });
    return;
  }
  if (command === 'validate-digest') {
    validateDigest(
      process.env.DIGEST_VALUE || '',
      process.env.DIGEST_LABEL || 'digest'
    );
    return;
  }
  throw new Error(
    'Usage: helm-chart-release.mjs <stage|verify-package|validate-digest>'
  );
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
