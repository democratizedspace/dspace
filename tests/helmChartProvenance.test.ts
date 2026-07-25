import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SOURCE_REPOSITORY,
  stampChartMetadata,
  verifyChartProvenance,
} from '../scripts/helm-chart-provenance.mjs';
import { parse } from 'yaml';

const revision = '0123456789abcdef0123456789abcdef01234567';
const source = `apiVersion: v2
name: dspace
version: 4.2.1
appVersion: "3.1.0"
description: preserved
annotations:
  example.test/preserved: yes
`;

describe('Helm chart provenance metadata', () => {
  it('preserves chart fields and annotations while stamping exact provenance', () => {
    const chart = parse(stampChartMetadata(source, revision));
    expect(chart.description).toBe('preserved');
    expect(chart.annotations['example.test/preserved']).toBe('yes');
    expect(chart.annotations).toMatchObject({
      'org.opencontainers.image.source': SOURCE_REPOSITORY,
      'org.opencontainers.image.revision': revision,
      'org.opencontainers.image.version': '3.1.0',
    });
    expect(() =>
      verifyChartProvenance(stampChartMetadata(source, revision), {
        version: '4.2.1',
        appVersion: '3.1.0',
        revision,
      })
    ).not.toThrow();
  });

  it.each(['abc1234', `${revision}0`, revision.toUpperCase(), 'not-a-sha'])(
    'rejects malformed or non-full revision %s',
    (invalid) =>
      expect(() => stampChartMetadata(source, invalid)).toThrow(
        /full source revision/
      )
  );

  it('rejects malformed chart coordinates and provenance mismatches', () => {
    expect(() =>
      stampChartMetadata(source.replace('4.2.1', 'v4.2.1'), revision)
    ).toThrow();
    expect(() =>
      verifyChartProvenance(stampChartMetadata(source, revision), {
        version: '4.2.0',
        appVersion: '3.1.0',
        revision,
      })
    ).toThrow(/version does not match/);
  });

  it('does not modify source content while producing staged metadata', () => {
    const root = mkdtempSync(join(tmpdir(), 'chart-provenance-'));
    const file = join(root, 'Chart.yaml');
    try {
      writeFileSync(file, source);
      stampChartMetadata(readFileSync(file, 'utf8'), revision);
      expect(readFileSync(file, 'utf8')).toBe(source);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
