import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const chartPath = join(repoRoot, 'charts', 'dspace', 'Chart.yaml');
const valuesPath = join(repoRoot, 'charts', 'dspace', 'values.yaml');
const packagePath = join(repoRoot, 'package.json');
const frontendPackagePath = join(repoRoot, 'frontend', 'package.json');
const packageLockPath = join(repoRoot, 'package-lock.json');
const docsVersionPath = join(repoRoot, 'docs', 'apps', 'dspace.version');
const guardPath = join(repoRoot, 'scripts', 'check-dspace-chart-version.sh');

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const frontendPackageJson = JSON.parse(
  readFileSync(frontendPackagePath, 'utf8')
);
const packageLockJson = JSON.parse(readFileSync(packageLockPath, 'utf8'));

function writeFixture(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'dspace-version-guard-'));
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

function runGuard(overrides: Record<string, string> = {}) {
  return spawnSync('bash', [guardPath], {
    cwd: repoRoot,
    env: { ...process.env, ...overrides },
    encoding: 'utf8',
  });
}

describe('charts/dspace release metadata', () => {
  const chartContent = readFileSync(chartPath, 'utf8');
  const valuesContent = readFileSync(valuesPath, 'utf8');
  const docsVersionContent = readFileSync(docsVersionPath, 'utf8');

  const chartVersionMatch = chartContent.match(/^version:\s*"?([^"\n]+)"?/m);
  const appVersionMatch = chartContent.match(/appVersion:\s*"?([^"\n]+)"?/);
  const imageTagMatch = valuesContent.match(/^\s*tag:\s*([^\n]+)/m);
  const docsVersionMatch = docsVersionContent.match(
    /^[0-9]+\.[0-9]+\.[0-9]+$/m
  );

  it('pins every authoritative release coordinate to 3.1.0', () => {
    expect(packageJson.version).toBe('3.1.0');
    expect(frontendPackageJson.version).toBe('3.1.0');
    expect(packageLockJson.version).toBe('3.1.0');
    expect(packageLockJson.packages[''].version).toBe('3.1.0');
    expect(chartVersionMatch?.[1]).toBe('3.1.0');
    expect(appVersionMatch?.[1]).toBe('3.1.0');
    expect(docsVersionMatch?.[0]).toBe('3.1.0');
  });

  it('keeps chart appVersion unprefixed while default image tag remains v-prefixed', () => {
    expect(
      appVersionMatch?.[1],
      'appVersion should not include a leading v'
    ).toBe('3.1.0');
    expect(imageTagMatch?.[1].trim(), 'image.tag should be v-prefixed').toBe(
      'v3.1.0'
    );
  });

  it('accepts the aligned active coordinate set', () => {
    const result = runGuard();

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(
      'DSPACE release coordinates are aligned: 3.1.0 (image tag v3.1.0)'
    );
  });

  it('rejects representative release-coordinate mismatches', () => {
    const mismatchedChart = writeFixture(
      'Chart.yaml',
      chartContent.replace('appVersion: "3.1.0"', 'appVersion: "v3.1.0"')
    );
    const appVersionResult = runGuard({ DSPACE_CHART_FILE: mismatchedChart });
    expect(appVersionResult.status).not.toBe(0);
    expect(appVersionResult.stderr).toContain(
      "Version coordinate mismatch: chart appVersion is 'v3.1.0', expected '3.1.0'"
    );

    const mismatchedValues = writeFixture(
      'values.yaml',
      valuesContent.replace('tag: v3.1.0', 'tag: 3.1.0')
    );
    const imageTagResult = runGuard({ DSPACE_VALUES_FILE: mismatchedValues });
    expect(imageTagResult.status).not.toBe(0);
    expect(imageTagResult.stderr).toContain(
      "Version coordinate mismatch: chart default image.tag is '3.1.0', expected 'v3.1.0'"
    );
  });

  it('does not treat historical v3.0.1 documentation as active-coordinate drift', () => {
    const historicalReferences = execFileSync(
      'rg',
      ['-n', 'v3\\.0\\.1', 'docs', 'tests'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );
    expect(historicalReferences).toContain('v3.0.1');

    const result = runGuard();
    expect(result.status, result.stderr).toBe(0);
  });
});
