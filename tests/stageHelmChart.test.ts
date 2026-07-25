import { describe, expect, it } from 'vitest';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';
import { SOURCE_REPOSITORY, stageChart } from '../scripts/stage-helm-chart.mjs';

const SHA = '0123456789abcdef0123456789abcdef01234567';

function fixture(run: (source: string, destination: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'stage-chart-'));
  const source = join(root, 'source');
  const destination = join(root, 'staged');
  mkdirSync(source);
  writeFileSync(
    join(source, 'Chart.yaml'),
    `apiVersion: v2\nname: dspace\nversion: 4.5.6\nappVersion: "3.1.0"\ndescription: retained\nannotations:\n  example.org/existing: retained\n`
  );
  try {
    run(source, destination);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('stageChart', () => {
  it('preserves metadata and annotations, adds provenance, and leaves source unchanged', () =>
    fixture((source, destination) => {
      const before = readFileSync(join(source, 'Chart.yaml'), 'utf8');
      expect(
        stageChart({
          sourceDir: source,
          destinationDir: destination,
          revision: SHA,
        })
      ).toEqual({
        version: '4.5.6',
        appVersion: '3.1.0',
        source: SOURCE_REPOSITORY,
      });
      const staged = parse(
        readFileSync(join(destination, 'Chart.yaml'), 'utf8')
      );
      expect(staged.description).toBe('retained');
      expect(staged.annotations['example.org/existing']).toBe('retained');
      expect(staged.annotations['org.opencontainers.image.source']).toBe(
        SOURCE_REPOSITORY
      );
      expect(staged.annotations['org.opencontainers.image.revision']).toBe(SHA);
      expect(staged.annotations['org.opencontainers.image.version']).toBe(
        '3.1.0'
      );
      expect(readFileSync(join(source, 'Chart.yaml'), 'utf8')).toBe(before);
    }));

  it.each(['abc', '0123456789abcdef0123456789abcdef0123456Z', '0123456789ab'])(
    'rejects malformed or shortened revision %s',
    (revision) =>
      fixture((source, destination) => {
        expect(() =>
          stageChart({
            sourceDir: source,
            destinationDir: destination,
            revision,
          })
        ).toThrow(/full source revision/);
      })
  );

  it('rejects malformed chart versions', () =>
    fixture((source, destination) => {
      writeFileSync(
        join(source, 'Chart.yaml'),
        'apiVersion: v2\nname: dspace\nversion: 1.2\nappVersion: 3.1.0\n'
      );
      expect(() =>
        stageChart({
          sourceDir: source,
          destinationDir: destination,
          revision: SHA,
        })
      ).toThrow(/chart version/);
    }));
});
