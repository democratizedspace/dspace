import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const repoRoot = path.resolve(__dirname, '..');
const readJobs = (filename: string) =>
  parse(
    readFileSync(path.join(repoRoot, '.github/workflows', filename), 'utf8')
  ).jobs;

describe('locked Playwright runner compatibility', () => {
  it('pins the IndexedDB browser job to supported Ubuntu 24.04', () => {
    const job = readJobs('ci.yml')['frontend-indexeddb-regression-e2e'];
    expect(job['runs-on']).toBe('ubuntu-24.04');
    expect(
      job.steps.some((step: { run?: string }) =>
        step.run?.includes('e2e/indexeddb-availability.spec.ts')
      )
    ).toBe(true);
  });

  it('pins both full browser shards without reducing browser coverage', () => {
    const job = readJobs('tests.yml').e2e;
    expect(job['runs-on']).toBe('ubuntu-24.04');
    expect(job.strategy.matrix.shard).toEqual(['1/2', '2/2']);
    expect(
      job.steps.some((step: { run?: string }) =>
        step.run?.includes(
          'install --with-deps chromium chromium-headless-shell firefox webkit'
        )
      )
    ).toBe(true);
  });
});

describe('explicit Ubuntu runner policy', () => {
  const workflowFiles = readdirSync(
    path.join(repoRoot, '.github/workflows')
  ).filter((filename) => /\.ya?ml$/.test(filename));

  it.each(workflowFiles)(
    '%s does not use the rolling Ubuntu image',
    (filename) => {
      const source = readFileSync(
        path.join(repoRoot, '.github/workflows', filename),
        'utf8'
      );
      expect(source).not.toContain('ubuntu-latest');
      for (const job of Object.values(readJobs(filename)) as Array<{
        'runs-on'?: string | string[];
      }>) {
        const runners = Array.isArray(job['runs-on'])
          ? job['runs-on']
          : [job['runs-on']];
        for (const runner of runners) {
          if (typeof runner === 'string' && runner.startsWith('ubuntu-')) {
            expect(runner).toMatch(/^ubuntu-\d{2}\.\d{2}(?:-arm)?$/);
          }
        }
      }
    }
  );
});
