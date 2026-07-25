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
  'frontend/package.json',
  'package-lock.json',
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

const read = (root: string, path: string) =>
  readFileSync(join(root, path), 'utf8');
const replace = (
  root: string,
  path: string,
  search: string | RegExp,
  value: string
) => {
  const file = join(root, path);
  const current = read(root, path);
  const next = current.replace(search, value);
  expect(next).not.toBe(current);
  writeFileSync(file, next);
};
const currentVersions = (root: string) => ({
  application: JSON.parse(read(root, 'package.json')).version as string,
  chart: read(root, 'charts/dspace/Chart.yaml').match(
    /^version:\s*"?([^"\s]+)"?$/m
  )?.[1] as string,
});
const withFixture = (check: (root: string) => void) => {
  const root = fixture();
  try {
    check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe('independent DSPACE application and chart coordinates', () => {
  it('passes current repository coordinates and reports both groups', () =>
    withFixture((root) => {
      const { application, chart } = currentVersions(root);
      const result = runGuard(root);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain(
        `application version ${application} (v${application})`
      );
      expect(result.stdout).toContain(`chart version ${chart}`);
    }));

  it('permits chart 3.0.2 with application 3.0.1', () =>
    withFixture((root) => {
      const { application, chart } = currentVersions(root);
      for (const path of [
        'package.json',
        'frontend/package.json',
        'package-lock.json',
      ]) {
        replace(
          root,
          path,
          new RegExp(`"version": "${application.replaceAll('.', '\\.')}"`, 'g'),
          '"version": "3.0.1"'
        );
      }
      replace(
        root,
        'charts/dspace/Chart.yaml',
        `version: ${chart}`,
        'version: 3.0.2'
      );
      replace(
        root,
        'charts/dspace/Chart.yaml',
        `appVersion: "${application}"`,
        'appVersion: "3.0.1"'
      );
      replace(
        root,
        'charts/dspace/values.yaml',
        `tag: v${application}`,
        'tag: v3.0.1'
      );
      writeFileSync(join(root, 'docs/apps/dspace.version'), '3.0.2\n');
      const result = runGuard(root);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('application version 3.0.1');
      expect(result.stdout).toContain('chart version 3.0.2');
    }));

  it.each([
    ['Application', 'root package version', 'package.json', null],
    ['Chart', 'chart version', 'charts/dspace/Chart.yaml', /^version:.*\n/m],
  ])('labels a missing %s field', (group, field, path, line) =>
    withFixture((root) => {
      if (line) replace(root, path, line, '');
      else rmSync(join(root, path));
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`${group} coordinate missing: ${field}`);
    })
  );

  it.each([
    [
      'Application',
      'root package version',
      'package.json',
      /"version": "[^"]+"/,
      '"version": "01.2.3"',
    ],
    [
      'Application',
      'chart appVersion',
      'charts/dspace/Chart.yaml',
      /^appVersion:.*$/m,
      'appVersion: "v1.2.3"',
    ],
    [
      'Chart',
      'chart version',
      'charts/dspace/Chart.yaml',
      /^version:.*$/m,
      'version: 1.02.3',
    ],
  ])('labels malformed %s field %s', (group, field, path, search, value) =>
    withFixture((root) => {
      replace(root, path, search, value);
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        `${group} coordinate malformed: ${field}`
      );
    })
  );

  it.each([
    [
      'root package version',
      'package.json',
      'version',
      'frontend package version',
    ],
    [
      'frontend package version',
      'frontend/package.json',
      'version',
      'frontend package version',
    ],
    [
      'package-lock top-level version',
      'package-lock.json',
      'version',
      'package-lock top-level version',
    ],
    [
      'package-lock packages[""].version',
      'package-lock.json',
      'packages',
      'package-lock packages[""].version',
    ],
    [
      'chart appVersion',
      'charts/dspace/Chart.yaml',
      'appVersion',
      'chart appVersion',
    ],
    [
      'chart default image.tag',
      'charts/dspace/values.yaml',
      'image.tag',
      'chart default image.tag',
    ],
  ])(
    'labels valid application drift in %s',
    (_coordinate, path, field, diagnostic) =>
      withFixture((root) => {
        const { application } = currentVersions(root);
        const driftVersion = application === '9.8.7' ? '9.8.6' : '9.8.7';

        if (path.endsWith('.json')) {
          const document = JSON.parse(read(root, path));
          if (field === 'packages')
            document.packages[''].version = driftVersion;
          else document.version = driftVersion;
          writeFileSync(
            join(root, path),
            `${JSON.stringify(document, null, 2)}\n`
          );
        } else if (field === 'appVersion') {
          replace(
            root,
            path,
            /^appVersion:.*$/m,
            `appVersion: "${driftVersion}"`
          );
        } else {
          replace(root, path, /^(\s*tag:)\s*.*$/m, `$1 v${driftVersion}`);
        }

        const result = runGuard(root);
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(
          `Application coordinate drift: ${diagnostic}`
        );
      })
  );

  it('labels chart drift with its field', () =>
    withFixture((root) => {
      const { chart } = currentVersions(root);
      writeFileSync(
        join(root, 'docs/apps/dspace.version'),
        chart === '8.8.8' ? '8.8.7\n' : '8.8.8\n'
      );
      const result = runGuard(root);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'Chart coordinate drift: docs/apps/dspace.version'
      );
    }));

  it.each([
    ['', 'found 0'],
    ['# comment only\n', 'found 0'],
    ['1.2.3\n2.3.4\n', 'found 2'],
    [' 1.2.3\n', "found ' 1.2.3'"],
    ['v1.2.3\n', "found 'v1.2.3'"],
    ['1.2.3 trailing\n', "found '1.2.3 trailing'"],
  ])(
    'rejects malformed docs/apps/dspace.version content %#',
    (content, detail) =>
      withFixture((root) => {
        writeFileSync(join(root, 'docs/apps/dspace.version'), content);
        const result = runGuard(root);
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(
          'Chart coordinate malformed: docs/apps/dspace.version'
        );
        expect(result.stderr).toContain(detail);
      })
  );

  it('uses a deterministic clean package destination and chart-derived coordinates', () => {
    const workflow = readFileSync(
      join(repoRoot, '.github/workflows/ci-helm.yml'),
      'utf8'
    );
    expect(workflow).toContain('dist="$RUNNER_TEMP/dspace-chart-dist"');
    expect(workflow).toContain('rm -rf "$stage" "$dist"');
    expect(workflow).toContain('mkdir -p "$dist"');
    expect(workflow).not.toContain('mktemp -d');
    expect(workflow).toContain('expected="$dist/dspace-${CHART_VERSION}.tgz"');
    expect(workflow).toContain('find "$dist" -maxdepth 1');
    expect(workflow).toContain('metadata=$(helm show chart');
    expect(workflow).toContain('${{ steps.release.outputs.chart_version }}');
  });

  it('does not scan historical release records as authoritative coordinates', () =>
    withFixture((root) => {
      mkdirSync(join(root, 'docs/qa'), { recursive: true });
      writeFileSync(
        join(root, 'docs/qa/v3.0.1.md'),
        'historical version v999.999.999\n'
      );
      expect(runGuard(root).status).toBe(0);
    }));
});
