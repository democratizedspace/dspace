import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('token.place context benchmark fixtures', () => {
  test('script uses synthetic fixtures and no secret-like literals', () => {
    const source = readFileSync(
      resolve(repoRoot, 'scripts/benchmark-token-place-context.mjs'),
      'utf8'
    );
    expect(source).toContain('SYNTHETIC_');
    expect(source).not.toMatch(/BEGIN (RSA|OPENSSH|PRIVATE) KEY/);
    expect(source).not.toMatch(/sk-[A-Za-z0-9]/);
    expect(source).not.toMatch(/ciphertext/i);
  });

  test('generated component totals sum to shaped payload totals for every scenario', () => {
    const output = execFileSync(
      'node',
      ['scripts/benchmark-token-place-context.mjs'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );
    const jsonPath = output.match(
      /Wrote (artifacts\/benchmarks\/token-place-context\/[^\s]+\.json)/
    )?.[1];
    expect(jsonPath).toBeTruthy();
    const report = JSON.parse(
      readFileSync(resolve(repoRoot, jsonPath ?? ''), 'utf8')
    );

    for (const scenario of report.scenarios) {
      const componentTotals = Object.values(
        scenario.metrics.componentTotals
      ) as Array<{
        characters: number;
        utf8Bytes: number;
      }>;
      expect(
        componentTotals.reduce((sum, total) => sum + total.characters, 0),
        scenario.id
      ).toBe(scenario.metrics.totalCharacters);
      expect(
        componentTotals.reduce((sum, total) => sum + total.utf8Bytes, 0),
        scenario.id
      ).toBe(scenario.metrics.totalUtf8Bytes);
    }
  });
});
