import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { ensureAstroBuild } from '../frontend/scripts/ensure-astro-build.mjs';

describe('ensureAstroBuild', () => {
  it('clears stale dist artifacts before rebuilding', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dspace-ensure-build-'));
    const staleFile = path.join(root, 'dist', 'server', 'stale.mjs');
    fs.mkdirSync(path.dirname(staleFile), { recursive: true });
    fs.writeFileSync(staleFile, 'stale');

    const exec = vi.fn();

    ensureAstroBuild({ root, exec, logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() } });

    expect(exec).toHaveBeenCalledWith('npm run build', {
      cwd: root,
      stdio: 'inherit',
    });
    expect(fs.existsSync(staleFile)).toBe(false);
  });
});
