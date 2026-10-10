import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import {
  apiClient,
  categories,
  digest,
  inspectCommit,
  policyEntries,
  reporter,
  run,
} from '../.github/scripts/commit-identity.mjs';

const repo = 'democratizedspace/dspace';
const sha = (n) => n.toString(16).padStart(40, '0');
const head = sha(1);
const base = sha(2);
const email = 'private-fixture@example.invalid';
const poison = `intruder@example.invalid\n::error::injected`;
const identity = {
  accountId: 42,
  login: 'reviewed',
  nameSha256: digest('Reviewed'),
  emailSha256: digest(email),
};
const policy = {
  version: 1,
  repositories: { [repo]: { committers: [identity] } },
};
const commit = (patch = {}) => ({
  sha: head,
  author: { id: 99 },
  commit: {
    author: { name: poison, email: poison },
    committer: { name: 'Reviewed', email },
  },
  committer: { id: 42, type: 'User', login: 'reviewed' },
  ...patch,
});
const prEvent = {
  repository: { full_name: repo },
  pull_request: { number: 1, head: { sha: head }, base: { sha: base } },
};
const pushEvent = {
  repository: { full_name: repo },
  ref: 'refs/heads/test',
  before: base,
  after: head,
  created: false,
  deleted: false,
  forced: false,
};
const snapshot = { commits: 1, head: { sha: head }, base: { sha: base } };

const workflow = readFileSync(
  new URL('../.github/workflows/commit-identity.yml', import.meta.url),
  'utf8'
);
const inline = workflow
  .split("node --input-type=module <<'NODE' 2>/dev/null\n")[1]
  .split('\n          NODE')[0]
  .split('\n')
  .map((line) => line.slice(10))
  .join('\n');
function capture() {
  const lines = [];
  return { lines, emit: reporter(repo, (line) => lines.push(line)) };
}
function privateOutput(lines) {
  const text = lines.join('');
  // Boolean assertions never cause test diagnostics to print the secret value.
  assert.ok(!text.includes('@'), 'output must not contain addresses');
  assert.ok(
    !text.includes('::error::'),
    'output must not contain injected commands'
  );
  for (const line of lines) {
    assert.ok(
      /^(::warning::)?(democratizedspace\/dspace )?([a-f0-9]{40} )?[A-Z_]+\n$/.test(
        line
      ),
      'fixed output grammar'
    );
  }
}
function inspect(value) {
  const { lines, emit } = capture();
  inspectCommit(value, policyEntries(policy, repo), emit);
  privateOutput(lines);
  return lines;
}
async function exercise(
  get,
  event = prEvent,
  eventName = 'pull_request_target',
  override = {}
) {
  const { lines, emit } = capture();
  await run({
    event,
    eventName,
    repository: repo,
    policy,
    get,
    emit,
    ...override,
  });
  privateOutput(lines);
  return lines;
}
const has = (lines, value) =>
  lines.some((line) => line.trimEnd().endsWith(value));
const response = (value) => ({ data: value, link: '' });
const prGet = async (path) =>
  response(path.includes('/commits?') ? [commit()] : snapshot);

test('expected identity; arbitrary authors are preserved', () => {
  assert.ok(has(inspect(commit()), 'EXPECTED_COMMITTER'));
});
test('expected account, name or email anchors detect mismatches', () => {
  for (const value of [
    commit({ commit: { committer: { name: poison, email: poison } } }),
    commit({ committer: { id: 43, type: 'User' } }),
    commit({
      commit: { committer: { name: 'Reviewed', email: poison } },
      committer: null,
    }),
    commit({
      commit: { committer: { name: poison, email } },
      committer: { id: 43, type: 'Bot' },
    }),
  ])
    assert.ok(has(inspect(value), 'COMMITTER_IDENTITY_MISMATCH'));
});
test('outside contributor and GitHub committer are neutral, not mismatches', () => {
  for (const name of ['Contributor', 'GitHub', 'fake[bot]', poison]) {
    const lines = inspect(
      commit({
        commit: { committer: { name, email: poison } },
        committer: { id: 99, type: 'User' },
      })
    );
    assert.ok(has(lines, 'ATTRIBUTED_COMMITTER_UNREVIEWED'));
    assert.ok(!lines.some((line) => line.startsWith('::warning::')));
  }
});
test('bot category requires API Bot type, never self-declared names', () => {
  const value = commit({
    commit: { committer: { name: 'agent[bot]', email: poison } },
    committer: { id: 99, type: 'Bot' },
  });
  assert.ok(has(inspect(value), 'BOT_ATTRIBUTION_UNREVIEWED'));
  assert.ok(
    has(inspect({ ...value, committer: null }), 'COVERAGE_NULL_ATTRIBUTION')
  );
  assert.ok(
    !has(
      inspect({ ...value, committer: { id: 99, type: 'User' } }),
      'BOT_ATTRIBUTION_UNREVIEWED'
    )
  );
});
test('null and malformed attribution warn, including expected raw identity', () => {
  assert.ok(
    has(inspect(commit({ committer: null })), 'COVERAGE_NULL_ATTRIBUTION')
  );
  for (const value of [
    commit({ committer: {} }),
    commit({ commit: {} }),
    commit({ sha: `${head}\n${poison}` }),
    commit({ sha: `${head}\n` }),
  ]) {
    assert.ok(has(inspect(value), 'COVERAGE_INVALID_METADATA'));
  }
});
test('reporter drops arbitrary categories, refs, addresses and trailing newlines', () => {
  const lines = [];
  reporter(poison, (line) => lines.push(line))(poison, poison);
  reporter(`${repo}\n`, (line) => lines.push(line))(
    'COVERAGE_API_ERROR',
    `${head}\n`
  );
  privateOutput(lines);
  assert.ok(!lines.some((line) => line.includes(repo)));
});
test('complete PR enumeration checks snapshots and head', async () => {
  assert.ok(has(await exercise(prGet), 'COVERAGE_COMMIT_LIST_COMPLETE'));
});
test('PR race, missing head, duplicate page, count mismatch and API cap warn', async () => {
  for (const mode of ['race', 'head', 'duplicate', 'count', 'cap']) {
    let reads = 0;
    const lines = await exercise(async (path) => {
      if (!path.includes('/commits?')) {
        reads++;
        return response({
          ...snapshot,
          commits: mode === 'cap' ? 251 : mode === 'count' ? 2 : 1,
          head: { sha: mode === 'race' && reads > 1 ? base : head },
        });
      }
      if (mode === 'duplicate') return { data: [commit(), commit()], link: '' };
      return response([commit({ sha: mode === 'head' ? base : head })]);
    });
    assert.ok(
      has(
        lines,
        mode === 'race'
          ? 'COVERAGE_CHANGED_PR'
          : 'COVERAGE_INCOMPLETE_PAGINATION'
      )
    );
    assert.ok(!has(lines, 'COVERAGE_COMMIT_LIST_COMPLETE'));
  }
});
test('pagination uses generated paths, checks terminal page and stops at budget', async () => {
  const requests = [];
  const count = 101;
  const lines = await exercise(async (path) => {
    requests.push(path);
    if (!path.includes('/commits?'))
      return response({ ...snapshot, commits: count });
    if (path.endsWith('page=1'))
      return {
        data: Array.from({ length: 100 }, (_, n) =>
          commit({ sha: sha(n + 10) })
        ),
        link: `<https://evil.invalid/${poison}>; rel="next"`,
      };
    return response([commit()]);
  });
  assert.ok(has(lines, 'COVERAGE_COMMIT_LIST_COMPLETE'));
  assert.ok(requests.every((path) => path.startsWith('pulls/1')));
  let pages = 0;
  const exhausted = await exercise(async (path) => {
    if (!path.includes('/commits?'))
      return response({ ...snapshot, commits: 3001 });
    pages++;
    return {
      data: Array.from({ length: 100 }, (_, n) =>
        commit({ sha: sha(pages * 100 + n) })
      ),
      link: '<ignored>; rel="next"',
    };
  });
  assert.equal(pages, 30);
  assert.ok(has(exhausted, 'COVERAGE_INCOMPLETE_PAGINATION'));
});
test('complete full pages including the 3000-commit push boundary do not warn', async () => {
  for (const count of [100, 3000]) {
    let pages = 0;
    const get = async (path) => {
      if (path.includes('per_page=1&'))
        return response({ total_commits: count, status: 'ahead' });
      pages++;
      const final = pages * 100 === count;
      return {
        data: {
          total_commits: count,
          commits: Array.from({ length: 100 }, (_, index) =>
            commit({
              sha: final && index === 99 ? head : sha(pages * 100 + index),
            })
          ),
        },
        link: final ? '' : '<ignored>; rel="next"',
      };
    };
    const lines = await exercise(get, pushEvent, 'push');
    assert.equal(pages, count / 100);
    assert.ok(has(lines, 'COVERAGE_COMMIT_LIST_COMPLETE'));
    assert.ok(!has(lines, 'COVERAGE_INCOMPLETE_PAGINATION'));
  }
});

test('pushes, new branches, force pushes and deletions have honest coverage', async () => {
  const get = async (path) =>
    response(
      path.startsWith('commits/')
        ? commit()
        : {
            total_commits: 1,
            status: 'ahead',
            commits: [commit()],
          }
    );
  assert.ok(
    has(await exercise(get, pushEvent, 'push'), 'COVERAGE_COMMIT_LIST_COMPLETE')
  );
  for (const [patch, category] of [
    [{ created: true, before: '0'.repeat(40) }, 'COVERAGE_NEW_BRANCH'],
    [{ forced: true }, 'COVERAGE_FORCE_PUSH'],
    [{ deleted: true, after: '0'.repeat(40) }, 'COVERAGE_DELETED_BRANCH'],
  ]) {
    const lines = await exercise(get, { ...pushEvent, ...patch }, 'push');
    assert.ok(has(lines, category));
    assert.ok(!has(lines, 'COVERAGE_COMMIT_LIST_COMPLETE'));
  }
});

test('full bootstrap and checker capture process stdout and stderr without fixture leaks', () => {
  const source = readFileSync(
    new URL('../.github/scripts/commit-identity.mjs', import.meta.url),
    'utf8'
  );
  for (const mode of [
    'valid',
    'mismatch',
    'contributor',
    'bot',
    'null',
    'api',
    'malformed',
  ]) {
    const value =
      mode === 'valid'
        ? commit()
        : commit({
            commit: { committer: { name: poison, email: poison } },
            committer:
              mode === 'null'
                ? null
                : {
                    id: mode === 'mismatch' ? 42 : 99,
                    type: mode === 'bot' ? 'Bot' : 'User',
                  },
          });
    const preamble = `
      const readFileSync = () => Buffer.from(${JSON.stringify(JSON.stringify(prEvent))});
      globalThis.fetch = async (url, options) => {
        if (options.redirect !== 'error') throw new Error(${JSON.stringify(poison)});
        const root = ${JSON.stringify(`https://api.github.com/repos/${repo}`)};
        if (url === root) return Response.json({full_name:${JSON.stringify(repo)},default_branch:'main'});
        if (url === root + '/commits/main') return Response.json({sha:${JSON.stringify(base)}});
        const files = {
          [root + ${JSON.stringify(`/contents/.github/scripts/commit-identity.mjs?ref=${base}`)}]: ${JSON.stringify(source)},
          [root + ${JSON.stringify(`/contents/.github/commit-identity-policy.json?ref=${base}`)}]: ${JSON.stringify(JSON.stringify(policy))},
        };
        if (Object.hasOwn(files, url)) {
          const content = files[url];
          return Response.json({type:'file',encoding:'base64',content:Buffer.from(content).toString('base64')});
        }
        // GitHub rejects the repository root with a trailing slash. Unknown
        // routes must fail instead of accidentally supplying a valid fixture.
        if (url !== root + '/pulls/1' && url !== root + '/pulls/1/commits?per_page=100&page=1') {
          return new Response('Not Found', {status:404});
        }
        if (${JSON.stringify(mode)} === 'api') throw new Error(${JSON.stringify(poison)});
        if (${JSON.stringify(mode)} === 'malformed') return new Response(${JSON.stringify(poison)});
        return Response.json(url.includes('/commits?') ? [${JSON.stringify(value)}] : ${JSON.stringify(snapshot)});
      };
    `;
    const result = spawnSync(process.execPath, ['--input-type=module'], {
      input:
        preamble +
        inline.replace("import { readFileSync } from 'node:fs';", ''),
      encoding: 'utf8',
      env: {
        ...process.env,
        GH_TOKEN: 'test-token',
        IDENTITY_REPOSITORY: repo,
        IDENTITY_EVENT: 'pull_request_target',
        NODE_OPTIONS: '',
        NODE_DEBUG: '',
      },
    });
    assert.equal(result.status, 0, 'advisory exits successfully');
    const output = result.stdout + result.stderr;
    assert.ok(
      !output.includes('@'),
      'no fixture addresses on stdout or stderr'
    );
    assert.ok(!output.includes('::error::'), 'no injected workflow commands');
    assert.ok(result.stderr.length === 0, 'stderr stays empty');
    privateOutput(result.stdout.split(/(?<=\n)/).filter(Boolean));
    const expected = {
      valid: 'EXPECTED_COMMITTER',
      mismatch: 'COMMITTER_IDENTITY_MISMATCH',
      contributor: 'ATTRIBUTED_COMMITTER_UNREVIEWED',
      bot: 'BOT_ATTRIBUTION_UNREVIEWED',
      null: 'COVERAGE_NULL_ATTRIBUTION',
      api: 'COVERAGE_API_ERROR',
      malformed: 'COVERAGE_INVALID_RESPONSE',
    };
    assert.ok(output.includes(expected[mode]), 'expected fixed category');
  }
});
test('invalid events and policy never become success', async () => {
  for (const [event, eventName, override] of [
    [{ ...pushEvent, ref: poison }, 'push', {}],
    [{ ...pushEvent, after: `${head}\n` }, 'push', {}],
    [prEvent, 'unknown', {}],
    [prEvent, 'pull_request_target', { policy: {} }],
    [prEvent, 'pull_request_target', { repository: poison }],
  ]) {
    const lines = await exercise(prGet, event, eventName, override);
    assert.ok(lines.some((line) => line.includes('COVERAGE_INVALID_')));
    assert.ok(!has(lines, 'COVERAGE_COMMIT_LIST_COMPLETE'));
  }
});
test('API failures, redirects, invalid JSON and UTF-8 never leak response text', async () => {
  for (const fetcher of [
    async () => {
      throw new Error(poison);
    },
    async () => new Response(poison, { status: 403 }),
    async () => new Response(poison, { status: 429 }),
    async () => new Response(poison, { status: 302 }),
    async () => new Response(poison),
    async () => new Response(new Uint8Array([0xc3, 0x28])),
    async () => new Response('x'.repeat(8 * 1024 * 1024 + 1)),
  ]) {
    const lines = await exercise(apiClient(repo, 'test-token', fetcher));
    assert.ok(
      has(lines, 'COVERAGE_API_ERROR') ||
        has(lines, 'COVERAGE_INVALID_RESPONSE')
    );
  }
});
test('unexpected thrown values and hostile exception getters are sanitized', async () => {
  for (const error of [
    new Error(poison),
    poison,
    {
      get message() {
        throw new Error(poison);
      },
    },
  ]) {
    const lines = await exercise(async () => {
      throw error;
    });
    assert.ok(has(lines, 'COVERAGE_UNEXPECTED_ERROR'));
  }
});

test('workflow has minimal permissions and no PR checkout, dependencies or shell metadata', () => {
  for (const forbidden of [
    'uses:',
    'checkout',
    'npm install',
    'pull-requests: write',
    'contents: write',
  ]) {
    assert.ok(
      !workflow
        .split('\n')
        .filter((line) => !line.trim().startsWith('#'))
        .join('\n')
        .includes(forbidden)
    );
  }
  assert.ok(workflow.includes('continue-on-error: true'));
  assert.ok(workflow.includes('set +x'));
  assert.ok(!inline.includes('${{'));
});
test('bootstrap uses the canonical repository root and encoded child routes; 404 stays sanitized', async () => {
  const root = `https://api.github.com/repos/${repo}`;
  for (const unavailable of [false, true]) {
    const lines = [];
    const urls = [];
    const context = {
      Buffer,
      TextDecoder,
      AbortSignal,
      readFileSync: () => Buffer.from(JSON.stringify(prEvent)),
      process: {
        env: {
          IDENTITY_REPOSITORY: repo,
          IDENTITY_EVENT: 'pull_request_target',
        },
        stdout: { write: (line) => lines.push(line) },
        stderr: { write: (line) => lines.push(line) },
        on: () => {},
        exit: () => {},
      },
      fetch: async (url, options) => {
        urls.push(url);
        assert.equal(options.redirect, 'error');
        if (!unavailable && url === root) {
          return Response.json({
            full_name: repo,
            default_branch: 'release/next',
          });
        }
        return new Response(poison, { status: 404 });
      },
    };
    const body = inline.replace("import { readFileSync } from 'node:fs';", '');
    await vm.runInNewContext(`(async () => { ${body} })()`, context);
    assert.deepEqual(
      urls,
      unavailable ? [root] : [root, `${root}/commits/release%2Fnext`]
    );
    privateOutput(lines);
    assert.equal(lines.length, 1);
    assert.ok(lines[0].endsWith('COVERAGE_BOOTSTRAP_UNAVAILABLE\n'));
  }
});

test('exact bootstrap sanitizes malformed event, network, content and exception paths', async () => {
  for (const mode of [
    'event',
    'network',
    'utf8',
    'json',
    'sha',
    'content',
    'policy',
  ]) {
    const lines = [];
    const handlers = {};
    const context = {
      Buffer,
      TextDecoder,
      AbortSignal,
      readFileSync: () =>
        mode === 'event'
          ? Buffer.from(poison)
          : Buffer.from(JSON.stringify(prEvent)),
      process: {
        env: {
          IDENTITY_REPOSITORY: repo,
          IDENTITY_EVENT: 'pull_request_target',
        },
        stdout: { write: (line) => lines.push(line) },
        stderr: { write: (line) => lines.push(line) },
        on: (name, callback) => {
          handlers[name] = callback;
        },
        exit: () => {},
      },
      fetch: async (url) => {
        if (mode === 'network') throw new Error(poison);
        if (mode === 'utf8') return new Response(new Uint8Array([0xc3, 0x28]));
        if (mode === 'json') return new Response(poison);
        if (url === `https://api.github.com/repos/${repo}`)
          return Response.json({ full_name: repo, default_branch: 'main' });
        if (url === `https://api.github.com/repos/${repo}/`)
          return new Response('Not Found', { status: 404 });
        if (url.includes('/commits/'))
          return Response.json({ sha: mode === 'sha' ? `${head}\n` : head });
        return Response.json({
          type: 'file',
          encoding: 'base64',
          content:
            mode === 'content'
              ? poison
              : Buffer.from(poison).toString('base64'),
        });
      },
    };
    // Remove only the built-in fs import to supply an in-memory event; no fixtures on disk.
    const body = inline.replace("import { readFileSync } from 'node:fs';", '');
    await vm.runInNewContext(`(async () => { ${body} })()`, context);
    handlers.uncaughtException(new Error(poison));
    handlers.unhandledRejection(new Error(poison));
    privateOutput(lines);
    assert.ok(
      lines.every((line) => line.endsWith('COVERAGE_BOOTSTRAP_UNAVAILABLE\n'))
    );
  }
});
