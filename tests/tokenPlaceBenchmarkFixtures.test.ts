import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

describe('token.place benchmark fixtures', () => {
  it('use synthetic data and do not include common secret markers', () => {
    const script = readFileSync(
      join(repoRoot, 'scripts', 'benchmark-token-place-context.mjs'),
      'utf8'
    );
    expect(script).toContain('Synthetic');
    expect(script).not.toMatch(/sk-[A-Za-z0-9]/);
    expect(script).not.toMatch(/ghp_[A-Za-z0-9]/);
    expect(script).not.toMatch(/BEGIN (RSA|OPENSSH|PRIVATE) KEY/);
    expect(script).not.toContain('PRIVATE_SYNTHETIC_SENTINEL');
  });
});
