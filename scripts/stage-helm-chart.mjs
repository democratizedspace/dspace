#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';

export const SOURCE_REPOSITORY = 'https://github.com/democratizedspace/dspace';
export const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/;
export const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function required(value, label, pattern) {
  if (
    typeof value !== 'string' ||
    !value ||
    (pattern && !pattern.test(value))
  ) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

export function readChart(chartYaml) {
  const document = parse(readFileSync(chartYaml, 'utf8'));
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('Invalid Chart.yaml document');
  }
  required(document.name, 'chart name');
  required(document.version, 'chart version', SEMVER_PATTERN);
  required(document.appVersion, 'chart appVersion', SEMVER_PATTERN);
  return document;
}

export function expectedAnnotations(revision, appVersion) {
  required(revision, 'full source revision', FULL_SHA_PATTERN);
  required(appVersion, 'application version', SEMVER_PATTERN);
  return {
    'org.opencontainers.image.source': SOURCE_REPOSITORY,
    'org.opencontainers.image.revision': revision,
    'org.opencontainers.image.version': appVersion,
  };
}

export function stageChart({ source, destination, revision }) {
  const sourcePath = resolve(required(source, 'source chart path'));
  const destinationPath = resolve(required(destination, 'staged chart path'));
  if (
    !existsSync(join(sourcePath, 'Chart.yaml')) ||
    lstatSync(sourcePath).isSymbolicLink()
  ) {
    throw new Error('Source chart must be a real chart directory');
  }
  if (
    sourcePath === destinationPath ||
    destinationPath.startsWith(`${sourcePath}/`)
  ) {
    throw new Error('Staged chart must be outside the source chart');
  }
  const chart = readChart(join(sourcePath, 'Chart.yaml'));
  const annotations = expectedAnnotations(revision, chart.appVersion);
  cpSync(sourcePath, destinationPath, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  const stagedChart = join(destinationPath, 'Chart.yaml');
  chart.annotations = { ...(chart.annotations || {}), ...annotations };
  writeFileSync(stagedChart, stringify(chart));
  return {
    name: chart.name,
    version: chart.version,
    appVersion: chart.appVersion,
    annotations,
  };
}

export function verifyChartMetadata({
  chartYaml,
  version,
  appVersion,
  revision,
}) {
  const chart = readChart(required(chartYaml, 'packaged Chart.yaml path'));
  if (
    chart.version !==
    required(version, 'expected chart version', SEMVER_PATTERN)
  ) {
    throw new Error(
      `Packaged chart version '${chart.version}' does not match '${version}'`
    );
  }
  if (
    chart.appVersion !==
    required(appVersion, 'expected appVersion', SEMVER_PATTERN)
  ) {
    throw new Error(
      `Packaged appVersion '${chart.appVersion}' does not match '${appVersion}'`
    );
  }
  for (const [key, value] of Object.entries(
    expectedAnnotations(revision, appVersion)
  )) {
    if (chart.annotations?.[key] !== value)
      throw new Error(`Invalid provenance annotation ${key}`);
  }
  return chart;
}

function parseArgs(argv) {
  const [command, ...args] = argv;
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (!flag?.startsWith('--') || !args[index + 1])
      throw new Error(`Invalid argument: ${flag}`);
    options[flag.slice(2)] = args[index + 1];
  }
  return { command, options };
}

function output(values) {
  const text =
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT)
    writeFileSync(process.env.GITHUB_OUTPUT, text, { flag: 'a' });
  else process.stdout.write(text);
}

export function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  if (command === 'stage') {
    const result = stageChart({
      source: options.source,
      destination: options.destination,
      revision: options.revision,
    });
    output({
      chart_name: result.name,
      chart_version: result.version,
      app_version: result.appVersion,
    });
  } else if (command === 'verify') {
    verifyChartMetadata({
      chartYaml: options['chart-yaml'],
      version: options.version,
      appVersion: options['app-version'],
      revision: options.revision,
    });
  } else {
    throw new Error('Usage: stage-helm-chart.mjs <stage|verify> [options]');
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
