import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';
import {
  SOURCE_REPOSITORY,
  stageChart,
  verifyChartMetadata,
} from '../scripts/stage-helm-chart.mjs';

const roots: string[] = [];
afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
);

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'chart-stage-'));
  roots.push(root);
  const source = join(root, 'source');
  cpSync(join(process.cwd(), 'charts/dspace'), source, { recursive: true });
  return { root, source, destination: join(root, 'staged') };
}

describe('Helm chart provenance staging', () => {
  it('preserves metadata and annotations, injects provenance, and leaves source unchanged', () => {
    const { source, destination } = fixture();
    const sourceYaml = join(source, 'Chart.yaml');
    const before = readFileSync(sourceYaml, 'utf8');
    const chart = parse(before);
    chart.annotations = { 'example.test/existing': 'preserved' };
    writeFileSync(sourceYaml, `${JSON.stringify(chart)}\n`);
    const actualBefore = readFileSync(sourceYaml, 'utf8');
    const revision = 'a'.repeat(40);

    const result = stageChart({ source, destination, revision });
    const staged = parse(readFileSync(join(destination, 'Chart.yaml'), 'utf8'));
    expect(staged.description).toBe(chart.description);
    expect(staged.annotations['example.test/existing']).toBe('preserved');
    expect(staged.annotations).toMatchObject({
      'org.opencontainers.image.source': SOURCE_REPOSITORY,
      'org.opencontainers.image.revision': revision,
      'org.opencontainers.image.version': result.appVersion,
    });
    expect(readFileSync(sourceYaml, 'utf8')).toBe(actualBefore);
    expect(() =>
      verifyChartMetadata({
        chartYaml: join(destination, 'Chart.yaml'),
        version: result.version,
        appVersion: result.appVersion,
        revision,
      })
    ).not.toThrow();
  });

  it.each(['abc1234', 'A'.repeat(40), 'g'.repeat(40), 'a'.repeat(64)])(
    'rejects malformed or shortened revision %s',
    (revision) => {
      const { source, destination } = fixture();
      expect(() => stageChart({ source, destination, revision })).toThrow(
        /revision/
      );
    }
  );

  it('rejects mismatched packaged metadata', () => {
    const { source, destination } = fixture();
    const revision = 'b'.repeat(40);
    const result = stageChart({ source, destination, revision });
    expect(() =>
      verifyChartMetadata({
        chartYaml: join(destination, 'Chart.yaml'),
        version: '9.9.9',
        appVersion: result.appVersion,
        revision,
      })
    ).toThrow(/version/);
  });
});
