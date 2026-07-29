import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('verify-build-sha metadata validation', () => {
  it('reports a bounded validation error when revision is missing', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dspace-build-sha-'));
    temporaryDirectories.push(directory);
    const metadataPath = join(directory, 'build_meta.json');
    writeFileSync(metadataPath, JSON.stringify({ gitSha: SHA }));

    const result = spawnSync(
      process.execPath,
      [resolve('scripts/verify-build-sha.mjs'), directory],
      {
        cwd: resolve('.'),
        encoding: 'utf8',
        env: {
          ...process.env,
          EXPECTED_SHA: SHA,
          VERIFY_BUILD_META_PATH: metadataPath,
        },
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Canonical build metadata has an invalid full revision.'
    );
    expect(result.stderr).not.toContain('TypeError');
  });
});
