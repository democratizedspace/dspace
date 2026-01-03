import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const scriptPath = path.resolve(repoRoot, 'scripts', 'link-check.mjs');

describe('Docs link checker', () => {
  it('passes for internal markdown routes and assets', () => {
    const output = execFileSync('node', [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('All local markdown links resolved.');
  });
});
