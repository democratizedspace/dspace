import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const readJobs = (filename: string) =>
  parse(readFileSync(`.github/workflows/${filename}`, 'utf8')).jobs;

describe('maintenance Playwright runner compatibility', () => {
  it('pins the IndexedDB browser gate to supported Ubuntu 24.04', () => {
    const job = readJobs('ci.yml')['frontend-indexeddb-regression-e2e'];
    expect(job['runs-on']).toBe('ubuntu-24.04');
    expect(job['continue-on-error']).toBeUndefined();
    expect(job.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          run: 'pnpm --dir frontend exec playwright install chromium',
        }),
        expect.objectContaining({
          run: 'npx playwright test e2e/indexeddb-availability.spec.ts --project=chromium --reporter=dot',
        }),
      ])
    );
  });

  it('pins both full shards without reducing browser coverage', () => {
    const job = readJobs('tests.yml').e2e;
    expect(job['runs-on']).toBe('ubuntu-24.04');
    expect(job['continue-on-error']).toBeUndefined();
    expect(job.strategy.matrix.shard).toEqual(['1/2', '2/2']);
    expect(job.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          run: 'sudo env "PATH=$PATH" pnpm --dir frontend exec playwright install --with-deps chromium chromium-headless-shell firefox webkit',
        }),
        expect.objectContaining({
          run: 'npx playwright test --shard=${{ matrix.shard }} --reporter=dot',
        }),
      ])
    );
  });
});
