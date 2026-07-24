import { describe, expect, it } from 'vitest';
import {
  GhcrGuardError,
  assertTagAbsent,
  describeManifest,
  fetchGhcrToken,
  getManifest,
  parseArgs,
} from '../scripts/ghcr-manifest.mjs';

const SECRET_PASSWORD = 'super-secret-token-value-do-not-leak'; // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  const lowered = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => lowered[name.toLowerCase()] ?? null },
    json: async () => body,
  };
}

function malformedJsonResponse(status: number, headers: Record<string, string> = {}) {
  const lowered = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => lowered[name.toLowerCase()] ?? null },
    json: async () => {
      throw new Error('Unexpected token in JSON');
    },
  };
}

function fetchFor({ tokenResponse, manifestResponse }: { tokenResponse: any; manifestResponse?: any }) {
  return async (url: string) => {
    if (url.includes('/token')) {
      return tokenResponse;
    }
    if (url.includes('/manifests/')) {
      return manifestResponse;
    }
    throw new Error(`Unexpected fetch call to ${url}`);
  };
}

function hangingFetch() {
  return (_url: string, init: { signal: AbortSignal }) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
}

const okToken = jsonResponse(200, { token: 'fake-bearer-token' }); // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)

describe('fetchGhcrToken', () => {
  it('throws a network GhcrGuardError when the request fails', async () => {
    const fetchImpl = async () => {
      throw new Error('getaddrinfo ENOTFOUND ghcr.io');
    };

    await expect(
      fetchGhcrToken({ owner: 'o', repo: 'r', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toMatchObject({ code: 'network' });
  });

  it('classifies a 401 as an auth failure and never leaks the password', async () => {
    const fetchImpl = fetchFor({ tokenResponse: jsonResponse(401, { message: 'denied' }) });

    await expect(
      fetchGhcrToken({ owner: 'o', repo: 'r', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(GhcrGuardError);
      expect((error as GhcrGuardError).code).toBe('auth');
      expect((error as Error).message).not.toContain(SECRET_PASSWORD);
      return true;
    });
  });

  it('classifies a 500 as indeterminate', async () => {
    const fetchImpl = fetchFor({ tokenResponse: jsonResponse(500, { message: 'boom' }) });

    await expect(
      fetchGhcrToken({ owner: 'o', repo: 'r', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toMatchObject({ code: 'indeterminate' });
  });

  it('fails closed on a timeout', async () => {
    await expect(
      fetchGhcrToken({
        owner: 'o',
        repo: 'r',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        fetchImpl: hangingFetch(),
        timeoutMs: 20,
      })
    ).rejects.toMatchObject({ code: 'timeout' });
  });

  it('fails closed on a malformed (non-JSON) token response', async () => {
    const fetchImpl = fetchFor({ tokenResponse: malformedJsonResponse(200) });

    await expect(
      fetchGhcrToken({ owner: 'o', repo: 'r', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toMatchObject({ code: 'malformed' });
  });

  it('fails closed when the token response has no token field', async () => {
    const fetchImpl = fetchFor({ tokenResponse: jsonResponse(200, { not_a_token: true }) }); // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)

    await expect(
      fetchGhcrToken({ owner: 'o', repo: 'r', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toMatchObject({ code: 'malformed' });
  });
});

describe('getManifest', () => {
  it('reports an authoritative 404 as absent', async () => {
    const fetchImpl = fetchFor({ tokenResponse: okToken, manifestResponse: jsonResponse(404, {}) });
    // getManifest is tested directly with a raw token, bypassing the token exchange.
    const result = await getManifest({
      owner: 'o',
      repo: 'r',
      tag: 'v1.0.0',
      token: 't', // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
      fetchImpl: async (url: string) => fetchImpl(url),
    });
    expect(result).toEqual({ status: 'absent' });
  });

  it('reports a 200 with a digest as present and parses per-platform digests', async () => {
    const body = {
      manifests: [
        { platform: { architecture: 'amd64', os: 'linux' }, digest: 'sha256:amd64digest' },
        { platform: { architecture: 'arm64', os: 'linux' }, digest: 'sha256:arm64digest' },
      ],
    };
    const fetchImpl = async () =>
      jsonResponse(200, body, { 'docker-content-digest': 'sha256:indexdigest' });

    const result = await getManifest({ owner: 'o', repo: 'r', tag: 'v1.0.0', token: 't', fetchImpl }); // scan-secrets: ignore (fixture token; no real secret literal)
    expect(result.status).toBe('present');
    expect(result.digest).toBe('sha256:indexdigest');
    expect(result.manifests).toEqual([
      { architecture: 'amd64', os: 'linux', digest: 'sha256:amd64digest' },
      { architecture: 'arm64', os: 'linux', digest: 'sha256:arm64digest' },
    ]);
  });

  it('fails closed on 401/403', async () => {
    const fetchImpl = async () => jsonResponse(403, {});
    await expect(
      getManifest({ owner: 'o', repo: 'r', tag: 'v1.0.0', token: 't', fetchImpl }) // scan-secrets: ignore (fixture token; no real secret literal)
    ).rejects.toMatchObject({ code: 'auth' });
  });

  it('fails closed on an indeterminate status', async () => {
    const fetchImpl = async () => jsonResponse(502, {});
    await expect(
      getManifest({ owner: 'o', repo: 'r', tag: 'v1.0.0', token: 't', fetchImpl }) // scan-secrets: ignore (fixture token; no real secret literal)
    ).rejects.toMatchObject({ code: 'indeterminate' });
  });

  it('fails closed when a 200 response is missing the digest header', async () => {
    const fetchImpl = async () => jsonResponse(200, { manifests: [] });
    await expect(
      getManifest({ owner: 'o', repo: 'r', tag: 'v1.0.0', token: 't', fetchImpl }) // scan-secrets: ignore (fixture token; no real secret literal)
    ).rejects.toMatchObject({ code: 'malformed' });
  });

  it('fails closed on a malformed manifest body', async () => {
    const fetchImpl = async () =>
      malformedJsonResponse(200, { 'docker-content-digest': 'sha256:indexdigest' });
    await expect(
      getManifest({ owner: 'o', repo: 'r', tag: 'v1.0.0', token: 't', fetchImpl }) // scan-secrets: ignore (fixture token; no real secret literal)
    ).rejects.toMatchObject({ code: 'malformed' });
  });
});

describe('assertTagAbsent', () => {
  it('resolves when the registry authoritatively reports the tag absent', async () => {
    const fetchImpl = fetchFor({ tokenResponse: okToken, manifestResponse: jsonResponse(404, {}) });
    await expect(
      assertTagAbsent({ owner: 'o', repo: 'r', tag: 'v1.0.0', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).resolves.toEqual({ status: 'absent' });
  });

  it('throws (fails closed) when the tag already exists, including the digest but never the password', async () => {
    const fetchImpl = fetchFor({
      tokenResponse: okToken,
      manifestResponse: jsonResponse(200, { manifests: [] }, { 'docker-content-digest': 'sha256:existingdigest' }),
    });

    await expect(
      assertTagAbsent({ owner: 'o', repo: 'r', tag: 'v1.0.0', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toSatisfy((error: unknown) => {
      const message = (error as Error).message;
      expect((error as GhcrGuardError).code).toBe('exists');
      expect(message).toContain('sha256:existingdigest');
      expect(message).not.toContain(SECRET_PASSWORD);
      return true;
    });
  });

  it('fails closed when the token request itself is denied', async () => {
    const fetchImpl = fetchFor({ tokenResponse: jsonResponse(401, {}) });
    await expect(
      assertTagAbsent({ owner: 'o', repo: 'r', tag: 'v1.0.0', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toMatchObject({ code: 'auth' });
  });
});

describe('describeManifest', () => {
  it('returns index/amd64/arm64 digests for a published multi-arch tag', async () => {
    const body = {
      manifests: [
        { platform: { architecture: 'amd64', os: 'linux' }, digest: 'sha256:amd64digest' },
        { platform: { architecture: 'arm64', os: 'linux' }, digest: 'sha256:arm64digest' },
      ],
    };
    const fetchImpl = fetchFor({
      tokenResponse: okToken,
      manifestResponse: jsonResponse(200, body, { 'docker-content-digest': 'sha256:indexdigest' }),
    });

    const result = await describeManifest({
      owner: 'o',
      repo: 'r',
      tag: 'v1.0.0',
      username: 'u',
      password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
      fetchImpl,
    });

    expect(result).toEqual({
      indexDigest: 'sha256:indexdigest',
      amd64Digest: 'sha256:amd64digest',
      arm64Digest: 'sha256:arm64digest',
    });
  });

  it('fails when the tag unexpectedly does not exist after a publish', async () => {
    const fetchImpl = fetchFor({ tokenResponse: okToken, manifestResponse: jsonResponse(404, {}) });
    await expect(
      describeManifest({ owner: 'o', repo: 'r', tag: 'v1.0.0', username: 'u', password: SECRET_PASSWORD, fetchImpl }) // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    ).rejects.toMatchObject({ code: 'missing-after-publish' });
  });
});

describe('parseArgs', () => {
  it('rejects a missing subcommand', () => {
    expect(() => parseArgs([])).toThrow(/Usage: ghcr-manifest\.mjs/);
  });

  it('rejects an unknown subcommand', () => {
    expect(() => parseArgs(['delete-everything'])).toThrow(/Usage: ghcr-manifest\.mjs/);
  });

  it('rejects a missing --owner/--repo/--tag', () => {
    expect(() => parseArgs(['check-absent', '--owner', 'o'])).toThrow(/--repo/);
  });

  it('rejects an unrecognized flag', () => {
    expect(() => parseArgs(['check-absent', '--owner', 'o', '--repo', 'r', '--tag', 'v1.0.0', '--bogus', 'x'])).toThrow(
      /Unrecognized argument/
    );
  });

  it('parses a fully specified check-absent invocation', () => {
    expect(parseArgs(['check-absent', '--owner', 'o', '--repo', 'r', '--tag', 'v1.0.0'])).toEqual({
      subcommand: 'check-absent',
      owner: 'o',
      repo: 'r',
      tag: 'v1.0.0',
    });
  });
});
