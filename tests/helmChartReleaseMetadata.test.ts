import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  SOURCE_REPOSITORY,
  stageChart,
  validateChartRelease,
  validateDigest,
} from '../scripts/helm-chart-release.mjs';

const revision = '0123456789abcdef0123456789abcdef01234567';

describe('Helm chart release metadata', () => {
  it('preserves chart metadata and annotations, injects provenance, and leaves the source unchanged', () => {
    const root = mkdtempSync(join(tmpdir(), 'chart-stage-'));
    const sourceDir = join(root, 'source');
    const stagedDir = join(root, 'staged');
    try {
      mkdirSync(sourceDir);
      const original = `apiVersion: v2\nname: dspace\ndescription: keep me\ntype: application\nversion: 3.0.2\nappVersion: "3.0.1"\nannotations:\n  example.com/existing: retained\n`;
      writeFileSync(join(sourceDir, 'Chart.yaml'), original);
      stageChart({ sourceDir, stagedDir, chartTag: 'chart-v3.0.2', revision });
      expect(readFileSync(join(sourceDir, 'Chart.yaml'), 'utf8')).toBe(
        original
      );
      const staged = parse(readFileSync(join(stagedDir, 'Chart.yaml'), 'utf8'));
      expect(staged.description).toBe('keep me');
      expect(staged.annotations['example.com/existing']).toBe('retained');
      expect(staged.annotations['org.opencontainers.image.source']).toBe(
        SOURCE_REPOSITORY
      );
      expect(staged.annotations['org.opencontainers.image.revision']).toBe(
        revision
      );
      expect(staged.annotations['org.opencontainers.image.version']).toBe(
        '3.0.1'
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('requires strict coordinates, an exact tag, and a full lowercase source revision', () => {
    const valid = {
      chartVersion: '3.0.2',
      appVersion: '3.0.1',
      chartTag: 'chart-v3.0.2',
      revision,
    };
    expect(() => validateChartRelease(valid)).not.toThrow();
    expect(() =>
      validateChartRelease({ ...valid, chartTag: 'chart-v3.0.3' })
    ).toThrow(/must equal/);
    expect(() =>
      validateChartRelease({ ...valid, chartVersion: '3.0' })
    ).toThrow(/chart version/);
    expect(() =>
      validateChartRelease({ ...valid, revision: revision.slice(0, 12) })
    ).toThrow(/source revision/);
    expect(() =>
      validateChartRelease({ ...valid, revision: revision.toUpperCase() })
    ).toThrow(/source revision/);
  });

  it('permanently tombstones chart 3.0.1 without rejecting a later chart whose appVersion is 3.0.1', () => {
    expect(() =>
      validateChartRelease({
        chartVersion: '3.0.1',
        appVersion: '9.9.9',
        chartTag: 'chart-v3.0.1',
        revision,
      })
    ).toThrow(/tombstoned/);
    expect(() =>
      validateChartRelease({
        chartVersion: '3.0.2',
        appVersion: '3.0.1',
        chartTag: 'chart-v3.0.2',
        revision,
      })
    ).not.toThrow();
  });

  it('strictly validates lowercase SHA-256 digests', () => {
    const digest = `sha256:${'a'.repeat(64)}`;
    expect(validateDigest(digest, 'digest')).toBe(digest);
    expect(() =>
      validateDigest(`sha256:${'A'.repeat(64)}`, 'digest')
    ).toThrow();
    expect(() => validateDigest('sha256:abc', 'digest')).toThrow();
  });
});
