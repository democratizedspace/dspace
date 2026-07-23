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
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const chartPath = join(repoRoot, 'charts', 'dspace', 'Chart.yaml');
const valuesPath = join(repoRoot, 'charts', 'dspace', 'values.yaml');
const versionFilePath = join(repoRoot, 'docs', 'apps', 'dspace.version');
const packageJson = JSON.parse(
  readFileSync(join(repoRoot, 'package.json'), 'utf8')
);
const frontendPackageJson = JSON.parse(
  readFileSync(join(repoRoot, 'frontend', 'package.json'), 'utf8')
);
const packageLock = JSON.parse(
  readFileSync(join(repoRoot, 'package-lock.json'), 'utf8')
);

const readChartValue = (content: string, key: string) => {
  const match = content.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'));
  return match?.[1];
};

describe('charts/dspace release metadata', () => {
  const chartContent = readFileSync(chartPath, 'utf8');
  const valuesContent = readFileSync(valuesPath, 'utf8');
  const versionFileContent = readFileSync(versionFilePath, 'utf8');

  const imageTagMatch = valuesContent.match(/^\s*tag:\s*([^\n]+)/m);

  it('keeps all authoritative release coordinates at 3.1.0', () => {
    expect(packageJson.version).toBe('3.1.0');
    expect(frontendPackageJson.version).toBe('3.1.0');
    expect(packageLock.version).toBe('3.1.0');
    expect(packageLock.packages[''].version).toBe('3.1.0');
    expect(readChartValue(chartContent, 'version')).toBe('3.1.0');
    expect(readChartValue(chartContent, 'appVersion')).toBe('3.1.0');
    expect(imageTagMatch?.[1].trim()).toBe('v3.1.0');
    expect(versionFileContent).toMatch(/^3\.1\.0$/m);
  });

  it('keeps chart appVersion unprefixed while the default image tag is v-prefixed', () => {
    expect(readChartValue(chartContent, 'appVersion')).toBe(
      packageJson.version
    );
    expect(readChartValue(chartContent, 'appVersion')).not.toMatch(/^v/);
    expect(imageTagMatch?.[1].trim()).toBe(`v${packageJson.version}`);
  });

  it('version guard accepts aligned coordinates', () => {
    const output = execFileSync(
      'bash',
      ['scripts/check-dspace-chart-version.sh'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );

    expect(output).toContain('DSPACE release coordinates are aligned at 3.1.0');
  });

  it('version guard rejects representative active-coordinate mismatches without scanning historical docs', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'dspace-version-guard-'));

    try {
      for (const path of [
        'package.json',
        'frontend/package.json',
        'package-lock.json',
        'charts/dspace/Chart.yaml',
        'charts/dspace/values.yaml',
        'docs/apps/dspace.version',
        'scripts/check-dspace-chart-version.sh',
      ]) {
        mkdirSync(dirname(join(tempRoot, path)), { recursive: true });
        cpSync(join(repoRoot, path), join(tempRoot, path), { recursive: true });
      }

      const historicalPath = join(tempRoot, 'docs/qa/v3.0.1.md');
      mkdirSync(dirname(historicalPath), { recursive: true });
      writeFileSync(
        historicalPath,
        'Historical v3.0.1 QA evidence must not fail the guard.\n'
      );

      const success = execFileSync(
        'bash',
        ['scripts/check-dspace-chart-version.sh'],
        {
          cwd: tempRoot,
          encoding: 'utf8',
        }
      );
      expect(success).toContain(
        'DSPACE release coordinates are aligned at 3.1.0'
      );

      const valuesFile = join(tempRoot, 'charts/dspace/values.yaml');
      writeFileSync(
        valuesFile,
        readFileSync(valuesFile, 'utf8').replace('tag: v3.1.0', 'tag: v3.0.1')
      );

      expect(() =>
        execFileSync('bash', ['scripts/check-dspace-chart-version.sh'], {
          cwd: tempRoot,
          encoding: 'utf8',
          stdio: 'pipe',
        })
      ).toThrow(/image\.tag/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
