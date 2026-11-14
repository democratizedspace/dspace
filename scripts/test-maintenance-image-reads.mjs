import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  readPublishedIndex,
  verifyPublication,
  policy,
} from './maintenance-image.mjs';

const secret = 'https://signed.invalid/?token=DO-NOT-LOG';
const platforms = {
  amd64: `sha256:${'b'.repeat(64)}`,
  arm64: `sha256:${'c'.repeat(64)}`,
};
const index = {
  manifests: Object.entries(platforms).map(([architecture, digest]) => ({
    platform: { os: 'linux', architecture },
    digest,
  })),
};
const bytes = JSON.stringify(index);
const hash = (body) =>
  `sha256:${createHash('sha256').update(body).digest('hex')}`;
const digest = hash(bytes);
const reply = (body, status = 200, header = digest) =>
  new Response(body, {
    status,
    headers: { 'docker-content-digest': header },
  });
const tokenReply = () => reply(JSON.stringify({ token: secret }));
const transport = (code = 'ECONNRESET') =>
  Object.assign(new TypeError('fetch failed'), {
    cause: { code, message: secret },
  });
function harness(overrides = {}) {
  const calls = [],
    delays = [],
    logs = [];
  const counts = { token: 0, index: 0 };
  return {
    calls,
    delays,
    logs,
    counts,
    options: {
      env: { GH_TOKEN: secret, GITHUB_ACTOR: 'owner' },
      wait: async (ms) => {
        delays.push(ms);
      },
      log: (line) => {
        logs.push(line);
      },
      request: async (url, options) => {
        assert.equal(options.method, 'GET');
        assert.equal(options.redirect, 'error');
        assert.ok(options.signal instanceof AbortSignal);
        calls.push(url);
        const stage = url.includes('/token?') ? 'token' : 'index';
        const count = ++counts[stage];
        return (
          overrides[stage]?.(count) ??
          (stage === 'token' ? tokenReply() : reply(bytes))
        );
      },
    },
  };
}

for (const stage of ['token', 'index']) {
  for (const failure of [
    408,
    429,
    500,
    502,
    503,
    504,
    'network',
    'timeout',
    'body',
  ]) {
    test(`${stage}: retries ${failure} with a fresh bounded GET`, async () => {
      const h = harness({
        [stage]: (count) => {
          if (count > 1) return;
          if (failure === 'network') throw transport();
          if (failure === 'timeout')
            throw new DOMException(secret, 'TimeoutError');
          if (failure === 'body')
            return {
              status: 200,
              arrayBuffer: async () => {
                throw transport('UND_ERR_SOCKET');
              },
            };
          return reply(secret, failure);
        },
      });
      assert.deepEqual(await readPublishedIndex(digest, h.options), platforms);
      assert.equal(h.counts[stage], 2);
      assert.deepEqual(h.delays, [1000]);
      assert.equal(h.logs.length, 1);
      assert.ok(!h.logs.join().includes(secret));
    });
  }
  test(`${stage}: exhaustion is bounded and sanitized`, async () => {
    const h = harness({
      [stage]: () => {
        throw transport();
      },
    });
    await assert.rejects(
      readPublishedIndex(digest, h.options),
      /Registry .*exhausted 4 attempts/
    );
    assert.equal(h.counts[stage], 4);
    assert.deepEqual(h.delays, [1000, 2000, 4000]);
    assert.ok(!h.logs.join().includes(secret));
  });
  for (const status of [301, 400, 401, 403, 404, 501]) {
    test(`${stage}: HTTP ${status} stops immediately`, async () => {
      const h = harness({ [stage]: () => reply(secret, status) });
      await assert.rejects(
        readPublishedIndex(digest, h.options),
        new RegExp(`HTTP ${status}; not retryable`)
      );
      assert.equal(h.counts[stage], 1);
      assert.deepEqual(h.delays, []);
    });
  }
  test(`${stage}: certificate/unknown failures are not retried or exposed`, async () => {
    for (const error of [transport('CERT_HAS_EXPIRED'), new Error(secret)]) {
      const h = harness({
        [stage]: () => {
          throw error;
        },
      });
      await assert.rejects(
        readPublishedIndex(digest, h.options),
        /non-retryable transport or body failure/
      );
      assert.equal(h.counts[stage], 1);
      assert.deepEqual(h.delays, []);
    }
  });
}

test('invalid token JSON/schema never retries', async () => {
  for (const body of [secret, '{}', 'null', '{"token":42}', '{"token":""}']) {
    const h = harness({ token: () => reply(body) });
    await assert.rejects(
      readPublishedIndex(digest, h.options),
      /Registry pull token: invalid .*body; not retryable/
    );
    assert.deepEqual(h.counts, { token: 1, index: 0 });
    assert.deepEqual(h.delays, []);
  }
});

test('raw bytes and digest header must independently match Buildx', async () => {
  for (const [body, header, reason] of [
    [bytes + '\n', digest, 'content'],
    [bytes, `sha256:${'d'.repeat(64)}`, 'header'],
    [bytes, '', 'header'],
  ]) {
    const h = harness({ index: () => reply(body, 200, header) });
    await assert.rejects(
      readPublishedIndex(digest, h.options),
      new RegExp(`${reason} digest mismatch`)
    );
    assert.equal(h.counts.index, 1);
    assert.deepEqual(h.delays, []);
  }
});

test('authenticated but invalid JSON and architecture schemas fail closed', async () => {
  for (const body of [
    secret,
    'null',
    '{}',
    JSON.stringify({ manifests: [index.manifests[0]] }),
    JSON.stringify({ manifests: [index.manifests[0], index.manifests[0]] }),
    JSON.stringify({
      manifests: index.manifests.map((m) => ({ ...m, digest: 'bad' })),
    }),
  ]) {
    const expected = hash(body);
    const h = harness({ index: () => reply(body, 200, expected) });
    await assert.rejects(
      readPublishedIndex(expected, h.options),
      /invalid (JSON body|architecture index)/
    );
    assert.deepEqual(h.delays, []);
  }
});

const receipt = () => ({
  source: policy.source,
  digest,
  published: true,
  verified: false,
});
for (const failure of ['token', 'index', 'amd64', 'arm64']) {
  test(`${failure} failure preserves unverified publication receipt`, async () => {
    const saved = [],
      smokes = [];
    const h = harness(
      ['token', 'index'].includes(failure)
        ? { [failure]: () => reply(secret, 503) }
        : {}
    );
    const r = receipt();
    await assert.rejects(
      verifyPublication(r, 'source', {
        readIndex: (value) => readPublishedIndex(value, h.options),
        runSmoke: async (image, arch) => {
          assert.equal(image, `${policy.image}@${platforms[arch]}`);
          smokes.push(arch);
          if (arch === failure) throw new Error(secret);
        },
        save: (value) => saved.push(structuredClone(value)),
      }),
      /exhausted 4 attempts|smoke: failed/
    );
    assert.ok(saved.every((value) => value.published && !value.verified));
    assert.ok(!JSON.stringify(saved).includes(secret));
    assert.deepEqual(
      smokes,
      failure === 'arm64'
        ? ['amd64', 'arm64']
        : failure === 'amd64'
          ? ['amd64']
          : []
    );
    assert.deepEqual(r.smokes, failure === 'arm64' ? { amd64: true } : {});
  });
}

test('verified is persisted only after both exact-digest smokes', async () => {
  const saved = [],
    smokes = [];
  const r = receipt();
  await verifyPublication(r, 'source', {
    readIndex: async () => platforms,
    runSmoke: async (image, arch, source) => {
      assert.equal(r.verified, false);
      assert.equal(source, 'source');
      assert.equal(image, `${policy.image}@${platforms[arch]}`);
      smokes.push(arch);
    },
    save: (value) => saved.push(structuredClone(value)),
  });
  assert.deepEqual(smokes, ['amd64', 'arm64']);
  assert.ok(saved.slice(0, -1).every((value) => !value.verified));
  assert.equal(saved.at(-1).verified, true);
  assert.deepEqual(saved.at(-1).smokes, { amd64: true, arm64: true });
});

for (const [name, overrides, expectedDigest, pattern] of [
  ['auth', { token: () => reply(secret, 401) }, digest, /HTTP 401/],
  ['invalid body', { token: () => reply(secret) }, digest, /invalid JSON body/],
  [
    'digest',
    { index: () => reply(bytes + ' ') },
    digest,
    /content digest mismatch/,
  ],
  [
    'architecture',
    { index: () => reply('{}', 200, hash('{}')) },
    hash('{}'),
    /invalid architecture index/,
  ],
]) {
  test(`${name} failure persists a sanitized unverified receipt without smokes`, async () => {
    const h = harness(overrides),
      saved = [];
    await assert.rejects(
      verifyPublication({ ...receipt(), digest: expectedDigest }, 'source', {
        readIndex: (value) => readPublishedIndex(value, h.options),
        runSmoke: () => {
          assert.fail('must not smoke');
        },
        save: (value) => saved.push(structuredClone(value)),
      }),
      pattern
    );
    assert.deepEqual(h.delays, []);
    assert.ok(saved.every((r) => r.published && !r.verified));
    assert.ok(!JSON.stringify(saved).includes(secret));
    assert.match(saved.at(-1).failure, pattern);
  });
}

test('HTTP exhaustion does not renew the successful token or exceed the retry budget', async () => {
  const h = harness({ index: () => reply(secret, 429) });
  await assert.rejects(
    readPublishedIndex(digest, h.options),
    /published tag index: HTTP 429; exhausted 4 attempts/
  );
  assert.deepEqual(h.counts, { token: 1, index: 4 });
  assert.deepEqual(h.delays, [1000, 2000, 4000]);
});

test('error body cleanup cannot turn an authentication denial into a retry', async () => {
  const h = harness({
    token: () => ({
      status: 403,
      body: {
        cancel: async () => {
          throw transport();
        },
      },
    }),
  });
  await assert.rejects(
    readPublishedIndex(digest, h.options),
    /HTTP 403; not retryable/
  );
  assert.deepEqual(h.counts, { token: 1, index: 0 });
});

test('the fourth attempt may succeed without renewing a successful token', async () => {
  const h = harness({
    index: (count) => (count < 4 ? reply(secret, 503) : reply(bytes)),
  });
  assert.deepEqual(await readPublishedIndex(digest, h.options), platforms);
  assert.deepEqual(h.counts, { token: 1, index: 4 });
  assert.deepEqual(h.delays, [1000, 2000, 4000]);
});

test('missing credentials stop before any registry access', async () => {
  const h = harness();
  await assert.rejects(
    readPublishedIndex(digest, { ...h.options, env: {} }),
    /pull token: existing workflow credentials unavailable/
  );
  assert.equal(h.calls.length, 0);
});
