import { readFileSync } from 'node:fs';
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
});
