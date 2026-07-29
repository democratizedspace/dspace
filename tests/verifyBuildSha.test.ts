import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const OTHER_SHA = 'fedcba9876543210fedcba9876543210fedcba98';
const temporaryDirectories: string[] = [];
const validMeta = {
  version: '3.2.0-rc.1+build.7',
  gitSha: SHA,
  revision: SHA,
  shortRevision: SHA.slice(0, 7),
  buildTimestamp: '2026-07-29T12:00:00Z',
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

const runVerifier = (
  meta: Record<string, unknown> | string,
  { server = SHA, client = SHA, sourceMapsOnly = false } = {}
) => {
  const directory = mkdtempSync(join(tmpdir(), 'dspace-build-sha-'));
  temporaryDirectories.push(directory);
  const dist = join(directory, 'dist');
  mkdirSync(join(dist, 'server'), { recursive: true });
  mkdirSync(join(dist, '_astro'), { recursive: true });
  writeFileSync(
    join(dist, 'server', sourceMapsOnly ? 'entry.js.map' : 'entry.js'),
    server
  );
  writeFileSync(
    join(dist, '_astro', sourceMapsOnly ? 'app.js.map' : 'app.js'),
    client
  );
  const metadataPath = join(directory, 'build_meta.json');
  writeFileSync(
    metadataPath,
    typeof meta === 'string' ? meta : JSON.stringify(meta)
  );
  return spawnSync(
    process.execPath,
    [resolve('scripts/verify-build-sha.mjs'), dist],
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
};

describe('verify-build-sha metadata and artifact validation', () => {
  it('accepts complete canonical metadata embedded in executable artifacts', () => {
    expect(runVerifier(validMeta).status).toBe(0);
  });

  it.each([
    [{ ...validMeta, revision: undefined }, 'invalid full revision'],
    [{ ...validMeta, gitSha: OTHER_SHA }, 'does not match EXPECTED_SHA'],
    [{ ...validMeta, revision: SHA.slice(0, 7) }, 'invalid full revision'],
    [{ ...validMeta, shortRevision: 'fffffff' }, 'invalid shortRevision'],
    [{ ...validMeta, version: 'release' }, 'invalid version'],
    [
      { ...validMeta, buildTimestamp: '2026-02-31T00:00:00Z' },
      'invalid buildTimestamp',
    ],
    [
      { ...validMeta, image: 'ghcr.io/example/dspace:main-fffffff' },
      'mismatched immutable',
    ],
  ])('rejects invalid metadata with a controlled error', (meta, message) => {
    const result = runVerifier(meta);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(message);
    expect(result.stderr).not.toContain('    at ');
  });

  it('rejects malformed metadata without a stack trace', () => {
    const result = runVerifier('{');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('metadata is missing or malformed');
    expect(result.stderr).not.toContain('SyntaxError');
  });

  it('does not count source maps as executable identity evidence', () => {
    const result = runVerifier(validMeta, { sourceMapsOnly: true });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing from SSR/server output');
  });

  it('rejects placeholders in scanned artifacts', () => {
    const result = runVerifier(validMeta, { server: `${SHA} v3:dev-local` });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Placeholder build identity');
  });
});
