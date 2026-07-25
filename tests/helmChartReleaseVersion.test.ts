import { describe, expect, it } from 'vitest';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const coordinatePaths = [
  'package.json',
  'package-lock.json',
  'frontend/package.json',
  'charts/dspace/Chart.yaml',
  'charts/dspace/values.yaml',
  'docs/apps/dspace.version',
];

const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'dspace-version-'));
  for (const path of coordinatePaths) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(repoRoot, path), join(root, path));
  }
  return root;
};

const runGuard = (root: string) =>
  spawnSync('bash', [join(repoRoot, 'scripts/check-dspace-chart-version.sh')], {
    env: { ...process.env, DSPACE_VERSION_ROOT: root },
    encoding: 'utf8',
  });

const replace = (
  root: string,
  path: string,
  search: string | RegExp,
  value: string
) => {
  const file = join(root, path);
  const current = readFileSync(file, 'utf8');
  const next = current.replace(search, value);
  expect(next).not.toBe(current);
  writeFileSync(file, next);
};

const withFixture = (test: (root: string) => void) => {
  const root = fixture();
  try {
    test(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe('DSPACE release coordinates', () => {
  it('passes the current repository coordinates and reports both groups', () =>
    withFixture((root) => {
      const result = runGuard(root);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('application version 3.1.0 (v3.1.0)');
      expect(result.stdout).toContain('chart version 3.1.0');
    }));

  it('permits chart 3.0.2 with application and appVersion 3.0.1', () =>
    withFixture((root) => {
      for (const path of [
        'package.json',
        'frontend/package.json',
        'package-lock.json',
      ]) {
        replace(root, path, /"version": "3\.1\.0"/g, '"version": "3.0.1"');
      }
      replace(
        root,
        'charts/dspace/Chart.yaml',
        /^version: 3\.1\.0$/m,
        'version: 3.0.2'
      );
      replace(
        root,
        'charts/dspace/Chart.yaml',
        /appVersion: "3\.1\.0"/,
        'appVersion: "3.0.1"'
      );
      replace(
        root,
        'charts/dspace/values.yaml',
        /(tag:) v3\.1\.0/,
        '$1 v3.0.1'
      );
      replace(root, 'docs/apps/dspace.version', /^3\.1\.0$/m, '3.0.2');
      const result = runGuard(root);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('application version 3.0.1');
      expect(result.stdout).toContain('chart version 3.0.2');
    }));

  it.each([
    [
      'frontend/package.json',
      /"version": "3\.1\.0"/,
      '"version": "3.0.9"',
      'frontend package version',
    ],
    [
      'package-lock.json',
      /^  "version": "3\.1\.0",/m,
      '  "version": "3.0.9",',
      'package-lock top-level version',
    ],
    [
      'package-lock.json',
      /("": \{\n      "name": "dspace",\n      )"version": "3\.1\.0"/,
      '$1"version": "3.0.9"',
      'package-lock packages[""].version',
    ],
    [
      'charts/dspace/Chart.yaml',
      /appVersion: "3\.1\.0"/,
      'appVersion: "3.0.9"',
      'chart appVersion',
    ],
    [
      'charts/dspace/values.yaml',
      /(tag:) v3\.1\.0/,
      '$1 v3.0.9',
      'chart default image.tag',
    ],
  ])('rejects application drift in %s', (path, search, value, label) =>
    withFixture((root) => {
      replace(root, path, search, value);
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`Application coordinate drift: ${label}`);
    })
  );

  it('rejects root application package drift from the remaining application coordinates', () =>
    withFixture((root) => {
      replace(
        root,
        'package.json',
        /"version": "3\.1\.0"/,
        '"version": "3.0.9"'
      );
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'Application coordinate drift: frontend package version'
      );
    }));

  it('rejects chart coordinate drift', () =>
    withFixture((root) => {
      replace(root, 'docs/apps/dspace.version', /^3\.1\.0$/m, '3.0.2');
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'Chart coordinate drift: docs/apps/dspace.version'
      );
    }));

  it('rejects a v-prefixed appVersion as non-SemVer application metadata', () =>
    withFixture((root) => {
      replace(
        root,
        'charts/dspace/Chart.yaml',
        /appVersion: "3\.1\.0"/,
        'appVersion: "v3.1.0"'
      );
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'application chart appVersion must be a semantic version'
      );
      expect(result.stderr).toContain(
        'Application coordinate drift: chart appVersion'
      );
    }));

  it('derives the package filename and OCI reference from the independent chart version', () => {
    const workflow = readFileSync(
      join(repoRoot, '.github/workflows/ci-helm.yml'),
      'utf8'
    );
    expect(workflow).toContain(
      'expected_chart_file="$chart_dist/dspace-${chart_version}.tgz"'
    );
    expect(workflow).toContain('charts/dspace/Chart.yaml');
    expect(workflow).toContain('steps.package.outputs.chart_version');
    expect(workflow).not.toMatch(/package\.json[\s\S]*expected_chart_file/);
    expect(workflow).toContain('helm show chart "$expected_chart_file"');
  });

  it('does not scan historical release records as authoritative coordinates', () =>
    withFixture((root) => {
      mkdirSync(join(root, 'docs', 'qa'), { recursive: true });
      writeFileSync(
        join(root, 'docs', 'qa', 'historical.md'),
        'chart version 0.0.1\n'
      );
      const result = runGuard(root);
      expect(result.status, result.stderr).toBe(0);
    }));
});
