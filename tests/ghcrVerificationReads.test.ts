// @vitest-environment node
import { createHash } from 'node:crypto';
import { createServer, type RequestListener } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertTagAbsent,
  describeManifest,
  inspectChart,
  inspectImage,
} from '../scripts/ghcr-manifest.mjs';

const auth = {
  owner: 'example',
  repo: 'dspace',
  tag: 'main-1234567',
  boundedReads: true,
  username: 'fixture-user',
  password: 'fictional-basic-credential', // scan-secrets: ignore (local fixture)
};
const fixtureBearer = 'fictional-bearer-credential'; // scan-secrets: ignore (local fixture)
const descriptor = (architecture: string, digit: string) => ({
  platform: { os: 'linux', architecture },
  digest: `sha256:${digit.repeat(64)}`,
});
const wireIndex = ` ${JSON.stringify({
  schemaVersion: 2,
  manifests: [descriptor('amd64', 'a'), descriptor('arm64', 'b')],
})}\n`;
const wireDigest = (wire: string) =>
  `sha256:${createHash('sha256').update(wire).digest('hex')}`;
const indexResponse = (wire = wireIndex, digest = wireDigest(wire)) =>
  new Response(wire, { headers: { 'docker-content-digest': digest } });
const fixtureTokenJson = JSON.stringify({ token: fixtureBearer }); // scan-secrets: ignore (local fixture)
const tokenResponse = () => new Response(fixtureTokenJson);

function isToken(url: string) {
  return new URL(url).pathname === '/token';
}

afterEach(() => vi.useRealTimers());

describe('bounded GHCR verification reads', () => {
  it('retries selected HTTP and transport failures with fresh signals and reuses a successful token', async () => {
    vi.useFakeTimers();
    const started = Date.now();
    const signals: AbortSignal[] = [];
    const intervals: number[] = [];
    let issued = 0;
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      expect(init.redirect).toBe('error');
      expect(init.method).toBe('GET');
      if (isToken(url)) {
        issued += 1;
        return tokenResponse();
      }
      signals.push(init.signal!);
      intervals.push(Date.now() - started);
      expect(new Headers(init.headers).get('Authorization')).toBe(
        `Bearer ${fixtureBearer}`
      );
      if (intervals.length === 1)
        return new Response('do not disclose body', { status: 503 });
      if (intervals.length === 2) return new Response(null, { status: 429 });
      if (intervals.length === 3) {
        throw new TypeError('do not disclose transport details', {
          cause: { code: 'UND_ERR_SOCKET' },
        });
      }
      return indexResponse();
    });
    const result = describeManifest({ ...auth, fetchImpl });
    const assertion = expect(result).resolves.toMatchObject({
      indexDigest: wireDigest(wireIndex),
    });
    await vi.runAllTimersAsync();
    await assertion;
    expect(issued).toBe(1);
    expect(intervals).toEqual([0, 1000, 3000, 7000]);
    expect(new Set(signals).size).toBe(4);
  });

  it('fails after four attempts without reacquiring a successful token', async () => {
    vi.useFakeTimers();
    let reads = 0;
    let tokens = 0;
    const fetchImpl = async (url: string) => {
      if (isToken(url)) {
        tokens += 1;
        return tokenResponse();
      }
      reads += 1;
      return new Response('private body', { status: 504 });
    };
    const result = describeManifest({ ...auth, fetchImpl });
    const assertion = expect(result).rejects.toMatchObject({
      code: 'indeterminate',
      message: 'GHCR verification manifest: HTTP 504; exhausted 4 attempts',
    });
    await vi.runAllTimersAsync();
    await assertion;
    expect(reads).toBe(4);
    expect(tokens).toBe(1);
  });

  it.each([
    ['HTTP 403', () => new Response('secret', { status: 403 }), 'auth'],
    [
      'HTTP 404',
      () => new Response('secret', { status: 404 }),
      'missing-after-publish',
    ],
    [
      'bad digest',
      () => indexResponse(wireIndex, `sha256:${'d'.repeat(64)}`),
      'digest-mismatch',
    ],
    ['invalid JSON', () => indexResponse('{SECRET-RESPONSE'), 'malformed'],
    ['invalid schema', () => indexResponse('{"schemaVersion":1}'), 'malformed'],
    [
      'uncoded fetch error',
      () => {
        throw new TypeError('fetch failed SECRET');
      },
      'network',
    ],
    [
      'certificate error',
      () => {
        throw new TypeError('certificate failure SECRET', {
          cause: { code: 'CERT_HAS_EXPIRED' },
        });
      },
      'network',
    ],
  ])(
    'does not retry %s and keeps diagnostics sanitized',
    async (_description, response, code) => {
      let reads = 0;
      const fetchImpl = async (url: string) => {
        if (isToken(url)) return tokenResponse();
        reads += 1;
        return response();
      };
      await expect(describeManifest({ ...auth, fetchImpl })).rejects.toSatisfy(
        (error: Error) => {
          expect(error).toMatchObject({ code });
          expect(error.message).not.toMatch(/secret|fictional/i);
          return true;
        }
      );
      expect(reads).toBe(1);
    }
  );

  it('does not give the absence check the verification retry policy', async () => {
    let reads = 0;
    const fetchImpl = async (url: string) => {
      if (isToken(url)) return tokenResponse();
      reads += 1;
      return new Response('unavailable', { status: 503 });
    };
    await expect(assertTagAbsent({ ...auth, fetchImpl })).rejects.toMatchObject(
      {
        code: 'indeterminate',
      }
    );
    expect(reads).toBe(1);
  });
});

const revision = '1'.repeat(40);

function imageFixture(fault = '') {
  const config = (architecture: string) =>
    JSON.stringify({
      architecture:
        fault === 'wrong-config-platform' && architecture === 'arm64'
          ? 's390x'
          : architecture,
      os: 'linux',
      config: { Labels: { 'org.opencontainers.image.revision': revision } },
    });
  const configs = { amd64: config('amd64'), arm64: config('arm64') };
  const responses = new Map<string, () => Response>();
  const manifests = (['amd64', 'arm64'] as const).map((arch) => {
    const configWire =
      fault === 'bad-config-json' && arch === 'arm64'
        ? '{incomplete'
        : configs[arch];
    const configDigest = wireDigest(configWire);
    responses.set(
      `/blobs/${configDigest}`,
      () =>
        new Response(
          fault === 'altered-blob' && arch === 'arm64' ? '{}' : configWire,
          {
            headers:
              fault === 'bad-blob-header'
                ? { 'docker-content-digest': wireDigest('{}') }
                : {},
          }
        )
    );
    const manifestWire = JSON.stringify({
      schemaVersion: 2,
      config: { digest: configDigest },
    });
    const digest = wireDigest(manifestWire);
    responses.set(`/manifests/${digest}`, () =>
      indexResponse(
        fault === 'alternate-manifest' && arch === 'arm64'
          ? manifestWire + '\n'
          : manifestWire
      )
    );
    return { platform: { os: 'linux', architecture: arch }, digest };
  });
  const index = JSON.stringify({ schemaVersion: 2, manifests });
  responses.set(`/manifests/${auth.tag}`, () => indexResponse(index));
  return {
    responses,
    expected: {
      indexDigest: wireDigest(index),
      amd64Digest: manifests[0].digest,
      arm64Digest: manifests[1].digest,
    },
  };
}

function fixturePath(url: string) {
  return decodeURIComponent(new URL(url, 'http://127.0.0.1').pathname).replace(
    `/v2/${auth.owner}/${auth.repo}`,
    ''
  );
}

describe('strict verification identity checks', () => {
  it('accepts an attestation but rejects a duplicate Linux runtime descriptor', async () => {
    const linuxAmd = descriptor('amd64', 'a');
    const linuxArm = descriptor('arm64', 'b');
    const attest = {
      ...descriptor('unknown', 'c'),
      platform: { os: 'unknown', architecture: 'unknown' },
    };
    const describe = (manifests: unknown[]) =>
      describeManifest({
        ...auth,
        fetchImpl: async (url: string) =>
          isToken(url)
            ? tokenResponse()
            : indexResponse(JSON.stringify({ schemaVersion: 2, manifests })),
      });
    await expect(describe([linuxAmd, linuxArm, attest])).resolves.toMatchObject(
      {
        amd64Digest: linuxAmd.digest,
        arm64Digest: linuxArm.digest,
      }
    );
    await expect(
      describe([linuxAmd, linuxArm, { ...linuxAmd, digest: '' }])
    ).rejects.toMatchObject({ code: 'missing-platform' });
    await expect(
      describe([linuxAmd, { ...linuxArm, digest: linuxAmd.digest }])
    ).rejects.toMatchObject({ code: 'missing-platform' });
    await expect(
      describe([linuxAmd, linuxArm, descriptor('s390x', 'e')])
    ).rejects.toMatchObject({ code: 'missing-platform' });
  });

  it.each([
    ['', undefined],
    ['altered-blob', 'digest-mismatch'],
    ['bad-blob-header', 'digest-mismatch'],
    ['alternate-manifest', 'digest-mismatch'],
    ['bad-config-json', 'malformed'],
    ['wrong-config-platform', 'platform-mismatch'],
  ])(
    'checks actual child manifest/config bytes and headers (%s)',
    async (fault, code) => {
      const { responses, expected } = imageFixture(fault);
      const fetchImpl = async (url: string) => {
        if (isToken(url)) return tokenResponse();
        const response = responses.get(fixturePath(url));
        if (!response) throw new Error('unexpected fixture route');
        return response();
      };
      const result = inspectImage({ ...auth, revision, fetchImpl });
      if (code) await expect(result).rejects.toMatchObject({ code });
      else await expect(result).resolves.toEqual(expected);
    }
  );

  it('checks chart config bytes and preserves chart identity checks', async () => {
    const config = JSON.stringify({ version: '4.2.0', appVersion: '3.1.0' });
    const artifact = JSON.stringify({
      schemaVersion: 2,
      config: { digest: wireDigest(config) },
      annotations: { 'org.opencontainers.image.revision': revision },
    });
    let configBody = config;
    const fetchImpl = async (url: string) => {
      if (isToken(url)) return tokenResponse();
      if (fixturePath(url) === `/manifests/${auth.tag}`)
        return indexResponse(artifact);
      if (fixturePath(url) === `/blobs/${wireDigest(config)}`)
        return new Response(configBody);
      throw new Error('unexpected fixture route');
    };
    const options = {
      ...auth,
      version: '4.2.0',
      appVersion: '3.1.0',
      revision,
      fetchImpl,
    };
    await expect(inspectChart(options)).resolves.toEqual({
      digest: wireDigest(artifact),
    });
    configBody = config + '\n';
    await expect(inspectChart(options)).rejects.toMatchObject({
      code: 'digest-mismatch',
    });
  });
});

async function useLoopback<T>(
  handler: RequestListener,
  test: (
    localFetch: (url: string, init: RequestInit) => Promise<Response>
  ) => Promise<T>
): Promise<T> {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('expected loopback listener');
  try {
    return await test((url, init) => {
      // Rewrite only the fixture target. Preserve the real fetch abort/redirect behavior.
      const path = new URL(url);
      return fetch(
        `http://127.0.0.1:${address.port}${path.pathname}${path.search}`,
        init
      );
    });
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  }
}

describe('real loopback transport faults', () => {
  it.each(['headers', 'body'])(
    'recovers from a stalled %s attempt without renewing the token',
    async (stall) => {
      let reads = 0;
      let tokens = 0;
      let disconnected = false;
      await useLoopback(
        (req, res) => {
          if (req.url?.startsWith('/token?')) {
            tokens += 1;
            res.end(fixtureTokenJson);
            return;
          }
          reads += 1;
          res.setHeader('docker-content-digest', wireDigest(wireIndex));
          if (reads === 1) {
            res.once('close', () => {
              disconnected = true;
            });
            if (stall === 'body') {
              res.setHeader('content-length', Buffer.byteLength(wireIndex));
              res.write(wireIndex.slice(0, 2));
            }
            return;
          }
          res.end(wireIndex);
        },
        async (fetchImpl) => {
          await expect(
            describeManifest({ ...auth, fetchImpl, timeoutMs: 300 })
          ).resolves.toMatchObject({ indexDigest: wireDigest(wireIndex) });
        }
      );
      expect(reads).toBe(2);
      expect(tokens).toBe(1);
      expect(disconnected).toBe(true);
    }
  );

  it('only the opt-in path rejects config redirects; the existing default follows them', async () => {
    const { responses, expected } = imageFixture();
    let targetReached = 0;
    let configRequests = 0;
    await useLoopback(
      async (req, res) => {
        const path = fixturePath(req.url ?? '/');
        if (path === '/token') {
          res.end(fixtureTokenJson);
          return;
        }
        if (path === '/config-redirect') {
          targetReached += 1;
          const digest = new URL(req.url!, 'http://127.0.0.1').searchParams.get(
            'digest'
          );
          const response = responses.get(`/blobs/${digest}`)!();
          res.end(await response.text());
          return;
        }
        const response = responses.get(path)?.();
        if (!response) {
          res.writeHead(404).end();
          return;
        }
        if (path.startsWith('/blobs/')) {
          configRequests += 1;
          const params = new URLSearchParams({
            digest: path.slice(7),
            signature: 'fixture-signature',
          });
          res.writeHead(307, { location: `/config-redirect?${params}` }).end();
          return;
        }
        res.setHeader(
          'docker-content-digest',
          response.headers.get('docker-content-digest')!
        );
        res.end(await response.text());
      },
      async (fetchImpl) => {
        const { boundedReads, ...existingOptions } = auth;
        await expect(
          inspectImage({ ...existingOptions, revision, fetchImpl })
        ).resolves.toEqual(expected);
        expect(targetReached).toBe(2);
        expect(configRequests).toBe(2);
        await expect(
          inspectImage({
            ...existingOptions,
            boundedReads,
            revision,
            fetchImpl,
          })
        ).rejects.toMatchObject({ code: 'network' });
        expect(targetReached).toBe(2);
        expect(configRequests).toBe(3);
      }
    );
  });

  it('rejects a signed redirect without following it or exposing its destination', async () => {
    let reads = 0;
    let redirectTargetReached = false;
    await useLoopback(
      (req, res) => {
        if (req.url?.startsWith('/token?')) {
          res.end(fixtureTokenJson);
          return;
        }
        if (req.url?.startsWith('/redirect-target')) {
          redirectTargetReached = true;
          res.end();
          return;
        }
        reads += 1;
        res
          .writeHead(307, {
            location: '/redirect-target?fixture=secret-signature',
          })
          .end();
      },
      async (fetchImpl) => {
        await expect(
          describeManifest({ ...auth, fetchImpl })
        ).rejects.toSatisfy((error: Error) => {
          expect(error).toMatchObject({ code: 'network' });
          expect(error.message).not.toMatch(
            /redirect-target|secret-signature|fictional/
          );
          return true;
        });
      }
    );
    expect(reads).toBe(1);
    expect(redirectTargetReached).toBe(false);
  });
});
