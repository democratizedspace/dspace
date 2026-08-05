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
import { parse, stringify } from 'yaml';
import {
  SOURCE_REPOSITORY,
  stageChart,
  verifyChart,
} from '../scripts/stage-helm-chart.mjs';

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
  it('pins chart 3.1.2 to application 3.1.1 with matching image coordinate', () => {
    const chart = parse(
      readFileSync(join(repoRoot, 'charts/dspace/Chart.yaml'), 'utf8')
    );
    const values = parse(
      readFileSync(join(repoRoot, 'charts/dspace/values.yaml'), 'utf8')
    );
    expect(chart.version).toBe('3.1.2');
    expect(chart.appVersion).toBe('3.1.1');
    expect(values.image.tag).toBe('v3.1.1');
    expect(
      readFileSync(join(repoRoot, 'docs/apps/dspace.version'), 'utf8')
    ).toMatch(/^3\.1\.2$/m);
  });

  it('accepts the chart-v3.1.2 release tag for the local chart coordinates', () => {
    const result = spawnSync(
      process.execPath,
      [
        join(repoRoot, 'scripts/check-release-consistency.mjs'),
        '--verify-chart-local',
      ],
      {
        cwd: repoRoot,
        env: { ...process.env, CHART_TAG: 'chart-v3.1.2', GITHUB_OUTPUT: '' },
        encoding: 'utf8',
      }
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('applicationVersion=3.1.1');
    expect(result.stdout).toContain('chartVersion=3.1.2');
  });

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
    expect(workflow).toContain('stage-helm-chart.mjs verify');
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

describe('staged Helm chart provenance', () => {
  const revision = '0123456789abcdef0123456789abcdef01234567';
  const chartFixture = (run: (source: string, staged: string) => void) => {
    const root = mkdtempSync(join(tmpdir(), 'stage-chart-'));
    const source = join(root, 'source');
    const staged = join(root, 'staged');
    mkdirSync(source);
    writeFileSync(
      join(source, 'Chart.yaml'),
      'apiVersion: v2\nname: dspace\nversion: 3.1.2\nappVersion: "3.1.1"\ndescription: retained\nannotations:\n  example.org/existing: retained\n'
    );
    try {
      run(source, staged);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };

  it('preserves metadata, adds provenance, verifies it, and leaves source unchanged', () =>
    chartFixture((source, staged) => {
      const before = readFileSync(join(source, 'Chart.yaml'), 'utf8');
      stageChart({ sourceDir: source, destinationDir: staged, revision });
      const stagedYaml = join(staged, 'Chart.yaml');
      const chart = parse(readFileSync(stagedYaml, 'utf8'));
      expect(chart.description).toBe('retained');
      expect(chart.version).toBe('3.1.2');
      expect(chart.appVersion).toBe('3.1.1');
      expect(chart.annotations['example.org/existing']).toBe('retained');
      expect(chart.annotations['org.opencontainers.image.source']).toBe(
        SOURCE_REPOSITORY
      );
      expect(chart.annotations['org.opencontainers.image.revision']).toBe(
        revision
      );
      expect(chart.annotations['org.opencontainers.image.version']).toBe(
        '3.1.1'
      );
      expect(
        verifyChart({
          chartYaml: stagedYaml,
          version: '3.1.2',
          appVersion: '3.1.1',
          revision,
        })
      ).toMatchObject({
        'org.opencontainers.image.source': SOURCE_REPOSITORY,
      });
      expect(readFileSync(join(source, 'Chart.yaml'), 'utf8')).toBe(before);
    }));

  it.each(['01.2.3', '1.2', 'v1.2.3', '1.2.3-rc.1', '1.2.3+build'])(
    'rejects non-strict chart SemVer %s',
    (version) =>
      chartFixture((source, staged) => {
        replace(source, 'Chart.yaml', 'version: 3.1.2', `version: ${version}`);
        expect(() =>
          stageChart({ sourceDir: source, destinationDir: staged, revision })
        ).toThrow(/chart version/);
      })
  );

  it.each(['01.2.3', '1.2', 'v1.2.3', '1.2.3-rc.1', '1.2.3+build'])(
    'rejects non-strict appVersion %s',
    (appVersion) =>
      chartFixture((source, staged) => {
        replace(
          source,
          'Chart.yaml',
          'appVersion: "3.1.1"',
          `appVersion: "${appVersion}"`
        );
        expect(() =>
          stageChart({ sourceDir: source, destinationDir: staged, revision })
        ).toThrow(/appVersion/);
      })
  );

  it.each(['abc', `${revision.slice(0, -1)}Z`, revision.slice(1)])(
    'rejects malformed revision %s',
    (value) =>
      chartFixture((source, staged) => {
        expect(() =>
          stageChart({
            sourceDir: source,
            destinationDir: staged,
            revision: value,
          })
        ).toThrow(/full source revision/);
      })
  );

  it.each(['text', '[]', 'null'])(
    'rejects non-mapping annotations: %s',
    (annotations) =>
      chartFixture((source, staged) => {
        replace(
          source,
          'Chart.yaml',
          /annotations:[\s\S]*$/,
          `annotations: ${annotations}\n`
        );
        expect(() =>
          stageChart({ sourceDir: source, destinationDir: staged, revision })
        ).toThrow(/annotations must be a YAML map/);
      })
  );

  it.each([
    ['version', 'version: 3.1.2', 'version: 3.1.3'],
    ['appVersion', 'appVersion: 3.1.1', 'appVersion: 3.1.2'],
    ['source', SOURCE_REPOSITORY, 'https://example.invalid/repo'],
    ['revision', revision, 'f'.repeat(40)],
    [
      'application version',
      'org.opencontainers.image.version: 3.1.1',
      'org.opencontainers.image.version: 3.1.2',
    ],
  ])('rejects tampered packaged %s metadata', (_field, search, value) =>
    chartFixture((source, staged) => {
      const before = readFileSync(join(source, 'Chart.yaml'), 'utf8');
      stageChart({ sourceDir: source, destinationDir: staged, revision });
      replace(staged, 'Chart.yaml', search, value);
      expect(() =>
        verifyChart({
          chartYaml: join(staged, 'Chart.yaml'),
          version: '3.1.2',
          appVersion: '3.1.1',
          revision,
        })
      ).toThrow(/mismatch/);
      expect(readFileSync(join(source, 'Chart.yaml'), 'utf8')).toBe(before);
    })
  );

  it.each([
    ['missing', 'org.opencontainers.image.revision', undefined],
    ['wrong', 'org.opencontainers.image.revision', 'f'.repeat(40)],
  ])(
    'rejects a %s provenance annotation despite a matching top-level lookalike',
    (_case, annotation, annotationValue) =>
      chartFixture((source, staged) => {
        stageChart({ sourceDir: source, destinationDir: staged, revision });
        const chartYaml = join(staged, 'Chart.yaml');
        const chart = parse(readFileSync(chartYaml, 'utf8'));
        chart[annotation] = revision;
        if (annotationValue === undefined) {
          delete chart.annotations[annotation];
        } else {
          chart.annotations[annotation] = annotationValue;
        }
        writeFileSync(chartYaml, stringify(chart));
        expect(() =>
          verifyChart({
            chartYaml,
            version: '3.1.2',
            appVersion: '3.1.1',
            revision,
          })
        ).toThrow(/revision mismatch/);
      })
  );
});
