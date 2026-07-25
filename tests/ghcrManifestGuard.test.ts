import { describe, expect, it } from 'vitest';
import {
  GhcrGuardError,
  assertTagAbsent,
  describeManifest,
  fetchGhcrToken,
  getManifest,
  inspectChart,
  inspectImage,
  parseArgs,
} from '../scripts/ghcr-manifest.mjs';

const validDigest = (character: string) => `sha256:${character.repeat(64)}`;

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
  function describeWith(manifests: unknown) {
    return describeManifest({
      owner: 'o', repo: 'r', tag: 'v1.0.0', username: 'u',
      password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
      fetchImpl: fetchFor({
        tokenResponse: okToken,
        manifestResponse: jsonResponse(200, { manifests }, { 'docker-content-digest': 'sha256:indexdigest' }),
      }),
    });
  }

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

  it.each([
    ['linux/amd64 is missing', [{ platform: { architecture: 'arm64', os: 'linux' }, digest: 'sha256:arm64digest' }]],
    ['linux/arm64 is missing', [{ platform: { architecture: 'amd64', os: 'linux' }, digest: 'sha256:amd64digest' }]],
    ['a non-Linux entry uses a required architecture', [
      { platform: { architecture: 'amd64', os: 'windows' }, digest: 'sha256:wrongos' },
      { platform: { architecture: 'arm64', os: 'linux' }, digest: 'sha256:arm64digest' },
    ]],
    ['the response is a single-image manifest', undefined],
    ['the manifest list is empty', []],
    ['a required platform has an empty digest', [
      { platform: { architecture: 'amd64', os: 'linux' }, digest: '' },
      { platform: { architecture: 'arm64', os: 'linux' }, digest: 'sha256:arm64digest' },
    ]],
  ])('fails closed when %s', async (_description, manifests) => {
    await expect(describeWith(manifests)).rejects.toMatchObject({ code: 'missing-platform' });
  });
});

describe('release artifact provenance inspection', () => {
  const revision = '0123456789abcdef0123456789abcdef01234567';
  const indexDigest = validDigest('1');
  const amd64Digest = validDigest('2');
  const arm64Digest = validDigest('3');
  const amd64Config = validDigest('4');
  const arm64Config = validDigest('5');
  const token = jsonResponse(200, { token: 'fixture-token' }); // scan-secrets: ignore

  function imageFetch(
    options: {
      missingArm?: boolean;
      wrongArmRevision?: boolean;
      absent?: boolean;
    } = {}
  ) {
    return async (url: string) => {
      if (url.includes('/token')) return token;
      if (url.endsWith('/manifests/main-0123456')) {
        if (options.absent) return jsonResponse(404, {});
        return jsonResponse(
          200,
          {
            manifests: [
              {
                platform: { os: 'linux', architecture: 'amd64' },
                digest: amd64Digest,
              },
              ...(!options.missingArm
                ? [
                    {
                      platform: { os: 'linux', architecture: 'arm64' },
                      digest: arm64Digest,
                    },
                  ]
                : []),
            ],
          },
          { 'docker-content-digest': indexDigest }
        );
      }
      if (url.endsWith(`/manifests/${encodeURIComponent(amd64Digest)}`))
        return jsonResponse(
          200,
          { config: { digest: amd64Config } },
          { 'docker-content-digest': amd64Digest }
        );
      if (url.endsWith(`/manifests/${encodeURIComponent(arm64Digest)}`))
        return jsonResponse(
          200,
          { config: { digest: arm64Config } },
          { 'docker-content-digest': arm64Digest }
        );
      if (url.endsWith(`/blobs/${amd64Config}`))
        return jsonResponse(200, {
          config: { Labels: { 'org.opencontainers.image.revision': revision } },
        });
      if (url.endsWith(`/blobs/${arm64Config}`))
        return jsonResponse(200, {
          config: {
            Labels: {
              'org.opencontainers.image.revision': options.wrongArmRevision
                ? 'f'.repeat(40)
                : revision,
            },
          },
        });
      throw new Error(`Unexpected fixture URL ${url}`);
    };
  }

  it('requires the immutable image and both correctly labelled platforms', async () => {
    await expect(
      inspectImage({
        owner: 'o',
        repo: 'r',
        tag: 'main-0123456',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        revision,
        fetchImpl: imageFetch(),
      })
    ).resolves.toEqual({ indexDigest, amd64Digest, arm64Digest }); // scan-secrets: ignore
    await expect(
      inspectImage({
        owner: 'o',
        repo: 'r',
        tag: 'main-0123456',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        revision,
        fetchImpl: imageFetch({ absent: true }),
      })
    ).rejects.toMatchObject({ code: 'missing' }); // scan-secrets: ignore
    await expect(
      inspectImage({
        owner: 'o',
        repo: 'r',
        tag: 'main-0123456',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        revision,
        fetchImpl: imageFetch({ missingArm: true }),
      })
    ).rejects.toMatchObject({ code: 'missing-platform' }); // scan-secrets: ignore
    await expect(
      inspectImage({
        owner: 'o',
        repo: 'r',
        tag: 'main-0123456',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        revision,
        fetchImpl: imageFetch({ wrongArmRevision: true }),
      })
    ).rejects.toMatchObject({ code: 'revision-mismatch' }); // scan-secrets: ignore
  });

  it('requires chart version, appVersion, revision, and immutable digest', async () => {
    const configDigest = validDigest('6');
    const fetchImpl = async (url: string) => {
      if (url.includes('/token')) return token;
      if (url.includes('/manifests/4.2.0'))
        return jsonResponse(
          200,
          {
            config: { digest: configDigest },
            annotations: { 'org.opencontainers.image.revision': revision },
          },
          { 'docker-content-digest': validDigest('7') }
        );
      if (url.endsWith(`/blobs/${configDigest}`))
        return jsonResponse(200, { version: '4.2.0', appVersion: '3.1.0' });
      throw new Error(`Unexpected fixture URL ${url}`);
    };
    await expect(
      inspectChart({
        owner: 'o',
        repo: 'charts/dspace',
        tag: '4.2.0',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        version: '4.2.0',
        appVersion: '3.1.0',
        revision,
        fetchImpl,
      })
    ).resolves.toEqual({ digest: validDigest('7') }); // scan-secrets: ignore
    await expect(
      inspectChart({
        owner: 'o',
        repo: 'charts/dspace',
        tag: '4.2.0',
        username: 'u',
        password: SECRET_PASSWORD, // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
        version: '4.2.1',
        appVersion: '3.1.0',
        revision,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: 'version-mismatch' }); // scan-secrets: ignore
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
