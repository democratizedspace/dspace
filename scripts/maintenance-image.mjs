import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// This publisher is deliberately limited to the reviewed v3.0.2 source. A new
// source/tree or exception requires another reviewed change, never an input override.
export const policy = Object.freeze({
  repository: 'democratizedspace/dspace',
  branch: 'release/v3.0.x',
  source: '47900748f61e1ef38c6289fc697f7a070f7fa3c9',
  tree: '35391f8fb62827713889915cba3c906090e45c7f',
  base: '1a31a569aff2dbeb238e8c2688b9e85140d2077d',
  image: 'ghcr.io/democratizedspace/dspace',
});
const waivedRuns = new Map([
  [40276727866, '.github/workflows/deploy-to-raspi.yml'],
  [40276728723, '.github/workflows/rpi-deploy.yml'],
  // Repeated initialization failures when the approved source branch was restored.
  [40433560737, '.github/workflows/deploy-to-raspi.yml'],
  [40433559761, '.github/workflows/rpi-deploy.yml'],
]);
const requiredChecks = [
  'unit',
  'lint',
  'e2e (1/2)',
  'e2e (2/2)',
  'root-tests',
  'build',
  'workflow-integrity',
  'docs-links',
  'frontend-indexeddb-regression-e2e',
  'Build multi-arch image',
  'Validate Docker build with host node_modules',
  'codecov/patch',
];

export function validateRequest(input) {
  assert.ok(
    Object.keys(input).every((key) =>
      ['event', 'repository', 'ref', 'source', 'mode', 'confirmation'].includes(
        key
      )
    ),
    'Unexpected publication input; image tags cannot be overridden'
  );
  assert.equal(input.event, 'workflow_dispatch', 'Manual dispatch only');
  assert.equal(input.repository, policy.repository, 'Wrong repository');
  assert.equal(
    input.ref,
    `refs/heads/${policy.branch}`,
    'Maintenance workflow ref required'
  );
  assert.equal(
    input.source,
    policy.source,
    'Source is not the approved full SHA'
  );
  assert.ok(['validate', 'publish'].includes(input.mode), 'Invalid mode');
  if (input.mode === 'publish') {
    assert.equal(
      input.confirmation,
      `publish v3.0.2 ${policy.source}`,
      'Explicit publication confirmation required'
    );
  }
  return `${policy.image}:hotfix-${input.source}`;
}

export function validateEvidence({
  pr,
  tree,
  versions,
  checks,
  statuses,
  runs,
  comments,
  reviews,
  threads,
}) {
  assert.equal(pr.merged, true, 'Hotfix PR must be merged first');
  assert.equal(pr.base.ref, policy.branch, 'Wrong PR base');
  assert.equal(pr.head.sha, policy.source, 'Approved hotfix head changed');
  assert.equal(tree, policy.tree, 'Source tree changed');
  assert.deepEqual(
    versions,
    ['3.0.2', '3.0.2', '24.22.1'],
    'Version or runtime drift'
  );
  for (const name of requiredChecks) {
    assert.ok(
      checks.some(
        (c) =>
          c.name === name &&
          c.status === 'completed' &&
          c.conclusion === 'success'
      ),
      `Missing green check: ${name}`
    );
  }
  // Include every returned run, not just GitHub's PR rollup. The sole exceptions
  // are the enumerated source-head initialization failures waived by the owner.
  for (const check of checks) {
    assert.equal(check.status, 'completed', `Pending check: ${check.name}`);
    assert.ok(
      ['success', 'skipped', 'neutral'].includes(check.conclusion),
      `Failed check: ${check.name}`
    );
  }
  for (const status of statuses)
    assert.equal(status.state, 'success', `Commit status: ${status.context}`);
  for (const run of runs) {
    assert.equal(run.head_sha, policy.source);
    if (run.conclusion === 'failure' && waivedRuns.get(run.id) === run.path) {
      assert.equal(
        run.jobCount,
        0,
        'Waived initialization failure must have zero jobs'
      );
      continue;
    }
    assert.equal(run.status, 'completed', `Pending workflow: ${run.name}`);
    assert.ok(
      ['success', 'skipped', 'neutral'].includes(run.conclusion),
      `Unwaived workflow failure: ${run.name}`
    );
  }
  assert.ok(
    threads.every((t) => t.isResolved),
    'Unresolved review thread'
  );
  const codex = latestEvidence(
    comments,
    (c) =>
      c.user.login === 'chatgpt-codex-connector[bot]' &&
      c.body.includes('codex-review-state:v1')
  );
  const match = codex?.body.match(/codex-review-state:v1 (\{[^\n]+\}) -->/);
  const review = match && JSON.parse(match[1]).code_review;
  assert.ok(
    review &&
      review.commit_sha === policy.source &&
      review.status === 'completed' &&
      review.has_unresolved_findings === false,
    'Codex review not clear on source'
  );
  const greptile = latestEvidence(
    comments,
    (c) =>
      c.user.login === 'greptile-apps[bot]' &&
      c.body.includes('greptile_summary')
  );
  assert.ok(
    greptile?.body.includes(`/commit/${policy.source}`) &&
      greptile.body.includes('no outstanding findings'),
    'Greptile review not clear on source'
  );
  for (const login of new Set(reviews.map((r) => r.user.login))) {
    const decisive = latestEvidence(
      reviews,
      (r) =>
        r.user.login === login &&
        ['APPROVED', 'CHANGES_REQUESTED'].includes(r.state)
    );
    assert.notEqual(
      decisive?.state,
      'CHANGES_REQUESTED',
      `Outstanding requested changes: ${login}`
    );
    const latest = latestEvidence(reviews, (r) => r.user.login === login);
    assert.ok(
      !['CHANGES_REQUESTED', 'DISMISSED', 'PENDING'].includes(latest.state),
      `Review not clear: ${login}`
    );
  }
  const copilot = latestEvidence(
    reviews,
    (r) => r.user.login === 'copilot-pull-request-reviewer[bot]'
  );
  assert.ok(
    copilot?.commit_id === policy.source &&
      copilot.body.includes('No open issues') &&
      ['COMMENTED', 'APPROVED'].includes(copilot.state),
    'Copilot review not clear on source'
  );
}

function latestEvidence(items, predicate) {
  return items.filter(predicate).sort((a, b) => {
    const time = (item) =>
      Date.parse(
        item.updated_at || item.submitted_at || item.created_at || ''
      ) || 0;
    return time(b) - time(a) || b.id - a.id;
  })[0];
}

export function assertAbsent(status, body) {
  assert.equal(
    status,
    404,
    status === 200
      ? 'Image coordinate already exists; never overwrite'
      : 'Registry absence not established'
  );
  assert.ok(
    body.errors?.some((e) => e.code === 'MANIFEST_UNKNOWN'),
    'Only explicit manifest absence is acceptable'
  );
}

export function latestStatuses(statuses) {
  const latest = new Map();
  for (const status of statuses) {
    assert.ok(Number.isSafeInteger(status.id), 'Status identity missing');
    if (
      !latest.has(status.context) ||
      latest.get(status.context).id < status.id
    )
      latest.set(status.context, status);
  }
  return [...latest.values()];
}

export function validatePublishedIndex(
  status,
  actualDigest,
  expectedDigest,
  index
) {
  assert.equal(status, 200, 'Published tag cannot be read');
  assert.match(expectedDigest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(
    actualDigest,
    expectedDigest,
    'Published tag does not resolve to the built digest'
  );
  const linux = index.manifests.filter((m) => m.platform?.os === 'linux');
  assert.equal(
    linux.length,
    2,
    'Expected exactly two Linux platform manifests'
  );
  const platforms = Object.fromEntries(
    linux.map((m) => [m.platform.architecture, m.digest])
  );
  assert.deepEqual(Object.keys(platforms).sort(), ['amd64', 'arm64']);
  for (const digest of Object.values(platforms))
    assert.match(digest, /^sha256:[a-f0-9]{64}$/);
  return platforms;
}

function command(binary, args, cwd, capture = false) {
  return execFileSync(binary, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    maxBuffer: 20 * 1024 * 1024,
  });
}
function api(endpoint) {
  return JSON.parse(command('gh', ['api', endpoint], undefined, true));
}
function pages(endpoint, key) {
  const data = JSON.parse(
    command(
      'gh',
      [
        'api',
        '--paginate',
        '--slurp',
        `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100`,
      ],
      undefined,
      true
    )
  );
  return data.flatMap((page) => (key ? page[key] : page));
}
async function registryToken() {
  assert.ok(
    process.env.GH_TOKEN && process.env.GITHUB_ACTOR,
    'Existing workflow token required'
  );
  const response = await fetch(
    'https://ghcr.io/token?service=ghcr.io&scope=repository:democratizedspace/dspace:pull',
    {
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.GITHUB_ACTOR}:${process.env.GH_TOKEN}`).toString('base64')}`,
      },
    }
  );
  assert.equal(
    response.status,
    200,
    'Existing package access unavailable; stop without requesting credentials'
  );
  const { token } = await response.json();
  assert.ok(token, 'Registry token missing');
  return token;
}
async function manifest(tag, token) {
  return fetch(`https://ghcr.io/v2/democratizedspace/dspace/manifests/${tag}`, {
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:
        'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json',
    },
  });
}

export async function main() {
  const input = {
    event: process.env.GITHUB_EVENT_NAME,
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    source: process.env.SOURCE_SHA,
    mode: process.env.MODE,
    confirmation: process.env.PUBLICATION_CONFIRMATION,
  };
  const image = validateRequest(input);
  const source = resolve(process.env.SOURCE_DIRECTORY || 'source');
  const git = (...args) => command('git', args, source, true).trim();
  assert.equal(
    git('rev-parse', 'HEAD'),
    policy.source,
    'Checkout is not the approved source'
  );
  assert.equal(
    git('status', '--porcelain'),
    '',
    'Source checkout must be clean'
  );
  git(
    'fetch',
    '--no-tags',
    'origin',
    `refs/heads/${policy.branch}:refs/remotes/origin/${policy.branch}`
  );
  git('merge-base', '--is-ancestor', policy.base, policy.source);
  git(
    'merge-base',
    '--is-ancestor',
    policy.source,
    `refs/remotes/origin/${policy.branch}`
  );
  for (const [path, blob] of [
    [
      '.github/workflows/deploy-to-raspi.yml',
      '20fd375c4e02a56ebbdad8bdc72762778a7c9e02',
    ],
    [
      '.github/workflows/rpi-deploy.yml',
      '1783ceff8f2055764e87e06e788653fd0a49d38c',
    ],
  ])
    assert.equal(
      git('rev-parse', `${policy.source}:${path}`),
      blob,
      'Waived legacy file changed'
    );
  const endpoint = `repos/${policy.repository}`;
  const runs = pages(
    `${endpoint}/actions/runs?head_sha=${policy.source}`,
    'workflow_runs'
  );
  for (const run of runs.filter((r) => waivedRuns.has(r.id))) {
    run.jobCount = api(`${endpoint}/actions/runs/${run.id}/jobs`).total_count;
  }
  const threadData = JSON.parse(
    command(
      'gh',
      [
        'api',
        'graphql',
        '-f',
        'query=query { repository(owner:"democratizedspace",name:"dspace") { pullRequest(number:4850) { reviewThreads(first:100) { pageInfo { hasNextPage } nodes { isResolved } } } } }',
      ],
      undefined,
      true
    )
  );
  const threads = threadData.data.repository.pullRequest.reviewThreads;
  assert.equal(
    threads.pageInfo.hasNextPage,
    false,
    'Too many review threads; manual review required'
  );
  validateEvidence({
    pr: api(`${endpoint}/pulls/4850`),
    tree: git('rev-parse', 'HEAD^{tree}'),
    versions: [
      JSON.parse(readFileSync(resolve(source, 'package.json'))).version,
      JSON.parse(readFileSync(resolve(source, 'frontend/package.json')))
        .version,
      readFileSync(resolve(source, '.nvmrc'), 'utf8').trim(),
    ],
    checks: pages(
      `${endpoint}/commits/${policy.source}/check-runs`,
      'check_runs'
    ),
    statuses: latestStatuses(
      pages(`${endpoint}/commits/${policy.source}/statuses`)
    ),
    runs,
    comments: pages(`${endpoint}/issues/4850/comments`),
    reviews: pages(`${endpoint}/pulls/4850/reviews`),
    threads: threads.nodes,
  });
  command('node', ['scripts/check-node-runtime.mjs'], source);
  const token = await registryToken();
  const tag = `hotfix-${policy.source}`;
  const absent = await manifest(tag, token);
  assertAbsent(absent.status, await absent.json());
  const buildArgs = [
    '--build-arg',
    `GIT_SHA=${policy.source}`,
    '--build-arg',
    `VITE_GIT_SHA=${policy.source}`,
    '--build-arg',
    'ENFORCE_VITE_GIT_SHA=1',
    '--build-arg',
    `DSPACE_VERSION=v3.0.2+${policy.source.slice(0, 7)}`,
    '--label',
    `org.opencontainers.image.revision=${policy.source}`,
    '--label',
    `org.opencontainers.image.source=https://github.com/${policy.repository}`,
    '--label',
    `org.opencontainers.image.version=v3.0.2+${policy.source.slice(0, 7)}`,
  ];
  if (input.mode === 'validate') {
    for (const arch of ['amd64', 'arm64']) {
      const local = `dspace-validate:${arch}`;
      command(
        'docker',
        [
          'buildx',
          'build',
          '--platform',
          `linux/${arch}`,
          '--load',
          '-t',
          local,
          ...buildArgs,
          '.',
        ],
        source
      );
      smoke(local, arch, source);
    }
    writeFileSync(
      'maintenance-receipt.json',
      JSON.stringify(
        {
          mode: 'validate',
          source: policy.source,
          tree: policy.tree,
          workflowSha: process.env.GITHUB_SHA,
          published: false,
        },
        null,
        2
      )
    );
    return;
  }
  // The job-level concurrency lock spans absence checking through push. There is
  // no blind retry after an uncertain push; an existing coordinate always stops.
  command(
    'docker',
    [
      'buildx',
      'build',
      '--platform',
      'linux/amd64,linux/arm64',
      '--push',
      '-t',
      image,
      '--metadata-file',
      'publish-metadata.json',
      ...buildArgs,
      '.',
    ],
    source
  );
  const metadata = JSON.parse(
    readFileSync(resolve(source, 'publish-metadata.json'))
  );
  const digest = metadata['containerimage.digest'];
  assert.match(digest, /^sha256:[a-f0-9]{64}$/);
  const receipt = {
    source: policy.source,
    tree: policy.tree,
    workflowSha: process.env.GITHUB_SHA,
    image: `${image}@${digest}`,
    digest,
    platforms: {},
    published: true,
    verified: false,
  };
  writeFileSync('maintenance-receipt.json', JSON.stringify(receipt, null, 2));
  const published = await manifest(tag, await registryToken());
  const platforms = validatePublishedIndex(
    published.status,
    published.headers.get('docker-content-digest'),
    digest,
    await published.json()
  );
  receipt.platforms = platforms;
  writeFileSync('maintenance-receipt.json', JSON.stringify(receipt, null, 2));
  for (const arch of ['amd64', 'arm64'])
    smoke(`${policy.image}@${platforms[arch]}`, arch, source);
  receipt.verified = true;
  writeFileSync('maintenance-receipt.json', JSON.stringify(receipt, null, 2));
}

function smoke(image, arch, source) {
  command('docker', [
    'run',
    '--rm',
    '--platform',
    `linux/${arch}`,
    '--entrypoint',
    'node',
    image,
    '-e',
    `const assert=require('node:assert/strict');assert.equal(process.versions.node,'24.22.1');assert.equal(JSON.parse(require('node:fs').readFileSync('/app/build_meta.json','utf8')).gitSha,'${policy.source}');require('canvas');console.log('runtime/full source/canvas verified')`,
  ]);
  const revision = command(
    'docker',
    [
      'image',
      'inspect',
      '--format',
      '{{index .Config.Labels "org.opencontainers.image.revision"}}',
      image,
    ],
    undefined,
    true
  ).trim();
  assert.equal(revision, policy.source, 'Image revision mismatch');
  command('docker', [
    'run',
    '--rm',
    '--platform',
    `linux/${arch}`,
    '--entrypoint',
    'node',
    '-e',
    `EXPECTED_SHA=${policy.source}`,
    '-e',
    'VERIFY_BUILD_META_PATH=/app/build_meta.json',
    '-v',
    `${resolve(source, 'scripts')}:/scripts:ro`,
    image,
    '/scripts/verify-build-sha.mjs',
    '/app/dist',
  ]);
  const name = `dspace-maintenance-${arch}`;
  command('docker', [
    'run',
    '-d',
    '--platform',
    `linux/${arch}`,
    '--name',
    name,
    '-p',
    '127.0.0.1::8080',
    image,
  ]);
  try {
    // Run the bounded HTTP probe inside the container; no target cluster involved.
    command('docker', [
      'exec',
      name,
      'node',
      '-e',
      `
      const assert=require('node:assert/strict');
      (async()=>{for(let n=0;n<60;n++){try{
        const health=await fetch('http://127.0.0.1:8080/healthz',{signal:AbortSignal.timeout(2000)});
        assert.equal(health.status,200);assert.equal((await health.json()).version,'v3.0.2+${policy.source.slice(0, 7)}');
        for(const path of ['/config.json','/','/docs/dCarbon'])assert.equal((await fetch('http://127.0.0.1:8080'+path,{signal:AbortSignal.timeout(5000)})).status,200);
        return;}catch(error){if(n===59)throw error;await new Promise(r=>setTimeout(r,1000));}}})().catch(e=>{console.error(e.message);process.exitCode=1});`,
    ]);
  } finally {
    command('docker', ['rm', '-f', name]);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
