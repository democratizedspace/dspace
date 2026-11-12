import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import {
  policy,
  validateRequest,
  validateEvidence,
  assertAbsent,
  latestStatuses,
  validatePublishedIndex,
} from '../scripts/maintenance-image.mjs';

const capturedReviews = JSON.parse(
  readFileSync('tests/fixtures/maintenanceChangelogReviews.json', 'utf8')
);

const request = () => ({
  event: 'workflow_dispatch',
  repository: policy.repository,
  ref: `refs/heads/${policy.branch}`,
  source: policy.source,
  mode: 'validate',
  confirmation: '',
});
const evidence = () => ({
  pr: {
    number: policy.sourcePr,
    merged: true,
    base: { ref: policy.branch },
    head: { sha: policy.source },
  },
  tree: policy.tree,
  versions: ['3.0.2', '3.0.2', '24.22.1'],
  checks: [
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
  ].map((name) => ({ name, status: 'completed', conclusion: 'success' })),
  statuses: [] as Array<{ context: string; state: string }>,
  runs: [
    {
      id: 42994230000,
      path: '.github/workflows/tests.yml',
      name: 'tests',
      head_sha: policy.source,
      status: 'completed',
      conclusion: 'success',
      jobCount: 1,
    },
  ],
  comments: [
    {
      id: 1,
      user: { login: 'chatgpt-codex-connector[bot]' },
      body: `<!-- codex-review-state:v1 ${JSON.stringify({ code_review: { commit_sha: policy.source, status: 'completed', has_unresolved_findings: false } })} -->`,
    },
    { ...capturedReviews.comments[1] },
  ],
  reviews: [
    {
      id: 1,
      state: 'COMMENTED',
      user: { login: 'copilot-pull-request-reviewer[bot]' },
      commit_id: policy.source,
      body: 'No open issues',
    },
  ],
  threads: [{ isResolved: true }],
});

describe('manual maintenance publication authorization', () => {
  it('accepts validation without publication confirmation', () => {
    expect(validateRequest(request())).toBe(
      `${policy.image}:hotfix-${policy.source}`
    );
  });
  it('rejects an unexpected publication tag instead of accepting an alias override', () => {
    expect(() =>
      validateRequest({ ...request(), image_tag: 'latest' })
    ).toThrow();
    expect(() => validateRequest({ ...request(), tag: 'v3.0.2' })).toThrow();
  });
  it('requires an exact explicit confirmation for publication', () => {
    const input = { ...request(), mode: 'publish' };
    expect(() => validateRequest(input)).toThrow();
    input.confirmation = `publish v3.0.2 ${policy.source}`;
    expect(validateRequest(input)).toContain(`hotfix-${policy.source}`);
  });
  it.each([
    ['event', 'push'],
    ['repository', 'fork/dspace'],
    ['ref', 'refs/heads/main'],
    ['ref', 'refs/heads/v3'],
    ['ref', 'refs/tags/v3.0.2'],
    ['source', 'main'],
    ['source', policy.source.slice(0, 7)],
    ['source', 'a'.repeat(40)],
    ['mode', 'deploy'],
  ])('rejects unauthorized %s=%s', (key, value) => {
    expect(() => validateRequest({ ...request(), [key]: value })).toThrow();
  });
});

describe('exact source and review gate', () => {
  const waivedFailures = [
    {
      id: 42994229967,
      path: '.github/workflows/deploy-to-raspi.yml',
    },
    {
      id: 42994228265,
      path: '.github/workflows/rpi-deploy.yml',
    },
  ].map((run) => ({
    ...run,
    name: run.path,
    head_sha: '558ce3c35163d97aea5594d6aba430c6a3dde1a3',
    status: 'completed',
    conclusion: 'failure',
    run_attempt: 1,
    jobCount: 0,
  }));
  it('accepts only the two exact approved source initialization failures', () => {
    expect(() =>
      validateEvidence({
        ...evidence(),
        runs: [...evidence().runs, ...waivedFailures],
      })
    ).not.toThrow();
  });
  it.each(waivedFailures)(
    'bounds exception $id to its source, path, first completed attempt and zero jobs',
    (run) => {
      expect(() =>
        validateEvidence({ ...evidence(), runs: [run] })
      ).not.toThrow();
      for (const invalid of [
        { id: 999 },
        { id: String(run.id) },
        { id: undefined },
        { path: waivedFailures.find((other) => other.id !== run.id)!.path },
        { path: run.path.replace('.github/workflows/', '') },
        { path: undefined },
        { head_sha: 'b'.repeat(40) },
        { head_sha: run.head_sha.slice(0, 7) },
        { head_sha: undefined },
        { status: 'in_progress' },
        { status: 'queued' },
        { status: undefined },
        { conclusion: 'cancelled' },
        { conclusion: 'timed_out' },
        { conclusion: 'action_required' },
        { conclusion: undefined },
        { run_attempt: 2 },
        { run_attempt: '1' },
        { run_attempt: undefined },
        { jobCount: 1 },
        { jobCount: -1 },
        { jobCount: '0' },
        { jobCount: null },
        { jobCount: undefined },
      ]) {
        expect(() =>
          validateEvidence({ ...evidence(), runs: [{ ...run, ...invalid }] })
        ).toThrow();
      }
    }
  );
  it('does not let approved failures hide another failing or pending run', () => {
    for (const change of [{ conclusion: 'failure' }, { status: 'in_progress' }])
      expect(() =>
        validateEvidence({
          ...evidence(),
          runs: [...waivedFailures, { ...evidence().runs[0], ...change }],
        })
      ).toThrow();
  });
  it('counts jobs across all attempts instead of trusting the latest attempt', () => {
    expect(readFileSync('scripts/maintenance-image.mjs', 'utf8')).toContain(
      '/actions/runs/${run.id}/jobs?filter=all'
    );
  });
  it.each([
    [40276727866, '.github/workflows/deploy-to-raspi.yml'],
    [40276728723, '.github/workflows/rpi-deploy.yml'],
    [40433560737, '.github/workflows/deploy-to-raspi.yml'],
    [40433559761, '.github/workflows/rpi-deploy.yml'],
    [43125103519, '.github/workflows/deploy-to-raspi.yml'],
    [43125101846, '.github/workflows/rpi-deploy.yml'],
  ])('does not waive old-source or publisher-head run %s', (id, path) => {
    const input = evidence();
    input.runs[0] = {
      ...input.runs[0],
      id: Number(id),
      path: String(path),
      conclusion: 'failure',
      jobCount: 0,
    };
    expect(() => validateEvidence(input)).toThrow('Unwaived workflow failure');
  });
  it('rejects the prior source, merge commit and publisher tip as build inputs', () => {
    for (const source of [
      '47900748f61e1ef38c6289fc697f7a070f7fa3c9',
      '9b0867402aefbd5acae61129b8e680407b7a4a04',
      'a'.repeat(40),
    ])
      expect(() => validateRequest({ ...request(), source })).toThrow();
  });
  it('keeps review API endpoints on the pinned source PR', () => {
    const script = readFileSync('scripts/maintenance-image.mjs', 'utf8');
    expect(script).toContain('pullRequest(number:${policy.sourcePr})');
    expect(script).toContain('/pulls/${policy.sourcePr}');
    expect(script).toContain('/issues/${policy.sourcePr}/comments');
    expect(script).not.toContain('/pulls/4850');
  });
  it('accepts captured public GitHub API review evidence from the approved source PR', () => {
    const captured = JSON.parse(
      readFileSync(
        'tests/fixtures/maintenanceChangelogReviews.json',
        'utf8'
      ).replace(/^\uFEFF/, '')
    );
    expect(() =>
      validateEvidence({
        ...evidence(),
        comments: captured.comments,
        reviews: captured.reviews,
      })
    ).not.toThrow();
  });
  it('rejects a synthetic later blocking event using an actual captured finding body', () => {
    const captured = JSON.parse(
      readFileSync('tests/fixtures/maintenanceReviews.json', 'utf8').replace(
        /^\uFEFF/,
        ''
      )
    );
    const finding = captured.reviews.find((review) =>
      review.body.includes('1 open issue')
    );
    expect(finding).toBeDefined();
    // The body is verbatim public evidence; only event identity/time/source are
    // synthetic, to exercise a regression without claiming a real later finding.
    const later = {
      ...finding,
      id: 999999999999,
      submitted_at: '2099-01-01T00:00:00Z',
      commit_id: policy.source,
    };
    expect(() =>
      validateEvidence({
        ...evidence(),
        comments: evidence().comments,
        reviews: [...evidence().reviews, later],
      })
    ).toThrow();
  });
  it('rejects historical review evidence and changed or newer captured Greptile text', () => {
    const old = JSON.parse(
      readFileSync('tests/fixtures/maintenanceReviews.json', 'utf8')
    );
    expect(() => validateEvidence({ ...evidence(), ...old })).toThrow();
    const captured = JSON.parse(
      readFileSync('tests/fixtures/maintenanceChangelogReviews.json', 'utf8')
    );
    for (const change of [
      { body: captured.comments[1].body + '\nNew finding' },
      { id: captured.comments[1].id + 1 },
      { body: captured.comments[1].body.replace('5/5', '1/5') },
      {
        body: captured.comments[1].body.replace(policy.source, 'b'.repeat(40)),
      },
    ]) {
      const comments = [
        captured.comments[0],
        { ...captured.comments[1], ...change },
      ];
      expect(() =>
        validateEvidence({ ...evidence(), comments, reviews: captured.reviews })
      ).toThrow();
    }
  });
  it('rejects later Greptile findings even when they quote the old clear phrase', () => {
    const later = {
      ...capturedReviews.comments[1],
      id: 6792068365,
      updated_at: '2099-01-01T00:00:00Z',
      body: `<!-- greptile_summary --> /commit/${policy.source} Previous review said no outstanding findings. New blocking security finding; do not merge.`,
    };
    expect(() =>
      validateEvidence({
        ...evidence(),
        comments: [...evidence().comments, later],
      })
    ).toThrow();
    expect(() =>
      validateEvidence({
        ...evidence(),
        comments: [evidence().comments[0], { ...later, id: 6792068364 }],
      })
    ).toThrow();
  });
  it('does not clear requested changes with a later comment-only review', () => {
    const e = evidence();
    e.reviews.push({ ...e.reviews[0], id: 99, state: 'CHANGES_REQUESTED' });
    e.reviews.push({ ...e.reviews[0], id: 100, state: 'COMMENTED' });
    expect(() => validateEvidence(e)).toThrow();
    e.reviews.push({ ...e.reviews[0], id: 101, state: 'APPROVED' });
    expect(() => validateEvidence(e)).not.toThrow();
  });
  it('accepts green evidence with no workflow exceptions', () => {
    expect(() => validateEvidence(evidence())).not.toThrow();
  });
  it.each(['codex', 'greptile', 'copilot', 'dismissed'])(
    'rejects a newer blocking %s result after an earlier clear result',
    (bot) => {
      const e = evidence();
      if (bot === 'codex')
        e.comments.push({
          ...e.comments[0],
          id: 99,
          body: e.comments[0].body.replace(
            '"has_unresolved_findings":false',
            '"has_unresolved_findings":true'
          ),
        });
      if (bot === 'greptile')
        e.comments.push({
          ...e.comments[1],
          id: 999999999999,
          updated_at: '2099-01-01T00:00:00Z',
          body: `<!-- greptile_summary --> /commit/${policy.source} Outstanding finding`,
        });
      if (bot === 'copilot')
        e.reviews.push({
          ...e.reviews[0],
          id: 99,
          body: 'New finding',
          state: 'CHANGES_REQUESTED',
        });
      if (bot === 'dismissed')
        e.reviews.push({ ...e.reviews[0], id: 99, state: 'DISMISSED' });
      expect(() => validateEvidence(e)).toThrow();
    }
  );
  it.each([
    [
      'unmerged hotfix',
      (e) => {
        e.pr.merged = false;
      },
    ],
    [
      'wrong source PR',
      (e) => {
        e.pr.number = 4850;
      },
    ],
    [
      'wrong base',
      (e) => {
        e.pr.base.ref = 'main';
      },
    ],
    [
      'changed approved head',
      (e) => {
        e.pr.head.sha = 'b'.repeat(40);
      },
    ],
    [
      'changed source tree',
      (e) => {
        e.tree = 'b'.repeat(40);
      },
    ],
    [
      'development version',
      (e) => {
        e.versions[0] = '3.1.0';
      },
    ],
    [
      'old runtime',
      (e) => {
        e.versions[2] = '20';
      },
    ],
    [
      'missing required check',
      (e) => {
        e.checks.shift();
      },
    ],
    [
      'pending check',
      (e) => {
        e.checks[0].status = 'in_progress';
      },
    ],
    [
      'failed check',
      (e) => {
        e.checks[0].conclusion = 'failure';
      },
    ],
    [
      'failed optional check',
      (e) => {
        e.checks.push({
          name: 'extra',
          status: 'completed',
          conclusion: 'failure',
        });
      },
    ],
    [
      'failed commit status',
      (e) => {
        e.statuses.push({ context: 'extra', state: 'failure' });
      },
    ],
    [
      'new failure outside waiver',
      (e) => {
        e.runs[0].conclusion = 'failure';
      },
    ],
    [
      'failed run with different workflow',
      (e) => {
        e.runs[0].path = 'other.yml';
        e.runs[0].conclusion = 'failure';
      },
    ],
    [
      'failed run with jobs',
      (e) => {
        e.runs[0].jobCount = 1;
        e.runs[0].conclusion = 'failure';
      },
    ],
    [
      'run on different source',
      (e) => {
        e.runs[0].head_sha = 'b'.repeat(40);
      },
    ],
    [
      'stale Codex review',
      (e) => {
        e.comments[0].body = e.comments[0].body.replace(
          policy.source,
          'b'.repeat(40)
        );
      },
    ],
    [
      'stale Greptile review',
      (e) => {
        e.comments[1].body = 'no outstanding findings';
      },
    ],
    [
      'stale Copilot review',
      (e) => {
        e.reviews[0].commit_id = 'b'.repeat(40);
      },
    ],
    [
      'unresolved review thread',
      (e) => {
        e.threads[0].isResolved = false;
      },
    ],
  ] as Array<[string, (e: ReturnType<typeof evidence>) => void]>)(
    'rejects %s',
    (_, mutate) => {
      const e = evidence();
      mutate(e);
      expect(() => validateEvidence(e)).toThrow();
    }
  );
});

describe('registry absence is fail closed', () => {
  it('accepts only explicit manifest absence', () => {
    expect(() =>
      assertAbsent(404, { errors: [{ code: 'MANIFEST_UNKNOWN' }] })
    ).not.toThrow();
  });
  it.each([200, 401, 403, 429, 500])('rejects status %s', (status) => {
    expect(() =>
      assertAbsent(status, { errors: [{ code: 'MANIFEST_UNKNOWN' }] })
    ).toThrow();
  });
  it('rejects an inaccessible repository or ambiguous 404', () => {
    expect(() =>
      assertAbsent(404, { errors: [{ code: 'NAME_UNKNOWN' }] })
    ).toThrow();
    expect(() => assertAbsent(404, {})).toThrow();
  });
});

describe('complete status evidence and published identity', () => {
  it('keeps a failing context beyond the first API page and only the latest state per context', () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      context: `context-${i}`,
      state: 'success',
    }));
    const secondPage = [
      { id: 200, context: 'late-failure', state: 'failure' },
      { id: 201, context: 'context-0', state: 'pending' },
    ];
    const statuses = latestStatuses([...firstPage, ...secondPage]);
    expect(statuses).toHaveLength(101);
    expect(statuses.find((s) => s.context === 'late-failure')?.state).toBe(
      'failure'
    );
    expect(statuses.find((s) => s.context === 'context-0')?.state).toBe(
      'pending'
    );
    expect(() => validateEvidence({ ...evidence(), statuses })).toThrow();
  });
  const digest = `sha256:${'a'.repeat(64)}`;
  const index = () => ({
    manifests: [
      {
        platform: { os: 'linux', architecture: 'amd64' },
        digest: `sha256:${'b'.repeat(64)}`,
      },
      {
        platform: { os: 'linux', architecture: 'arm64' },
        digest: `sha256:${'c'.repeat(64)}`,
      },
    ],
  });
  it('accepts the exact tag-to-index binding and both architectures', () => {
    expect(
      Object.keys(validatePublishedIndex(200, digest, digest, index())).sort()
    ).toEqual(['amd64', 'arm64']);
  });
  it.each([404, 401, 500])('rejects post-push tag response %s', (status) => {
    expect(() =>
      validatePublishedIndex(status, digest, digest, index())
    ).toThrow();
  });
  it('rejects a moved tag, missing architecture and duplicate architecture', () => {
    expect(() =>
      validatePublishedIndex(200, `sha256:${'d'.repeat(64)}`, digest, index())
    ).toThrow();
    expect(() =>
      validatePublishedIndex(200, digest, digest, {
        manifests: [index().manifests[0]],
      })
    ).toThrow();
    expect(() =>
      validatePublishedIndex(200, digest, digest, {
        manifests: [index().manifests[0], index().manifests[0]],
      })
    ).toThrow();
  });
});

describe('publisher workflow boundary', () => {
  const workflow = parse(readFileSync('.github/workflows/build.yml', 'utf8'));
  it('defaults to validation, and publication requires the validation job', () => {
    expect(workflow.on.workflow_dispatch.inputs.publish.default).toBe(false);
    expect(workflow.jobs['maintenance-publish'].needs).toBe(
      'maintenance-validate'
    );
    expect(workflow.jobs['maintenance-publish'].if).toContain(
      'inputs.publish == true'
    );
    for (const name of ['maintenance-validate', 'maintenance-publish']) {
      expect(workflow.jobs[name].if).toContain(
        "github.event_name == 'workflow_dispatch'"
      );
      expect(workflow.jobs[name].if).toContain(
        "github.ref == 'refs/heads/release/v3.0.x'"
      );
      expect(workflow.jobs[name].permissions.contents).toBe('read');
      const checkouts = workflow.jobs[name].steps.filter((s) =>
        s.uses?.startsWith('actions/checkout')
      );
      expect(
        checkouts.every((s) => s.with['persist-credentials'] === false)
      ).toBe(true);
      expect(checkouts[1].with.ref).toBe('${{ inputs.source_sha }}');
    }
    expect(workflow.jobs['maintenance-validate'].permissions.packages).toBe(
      'read'
    );
    expect(workflow.jobs['maintenance-publish'].permissions.packages).toBe(
      'write'
    );
    expect(
      workflow.jobs['maintenance-publish'].concurrency['cancel-in-progress']
    ).toBe(false);
  });
  it('does not add automatic publication triggers or remote deployment actions', () => {
    expect(Object.keys(workflow.on).sort()).toEqual([
      'pull_request',
      'push',
      'workflow_dispatch',
    ]);
    const jobs = JSON.stringify([
      workflow.jobs['maintenance-validate'],
      workflow.jobs['maintenance-publish'],
    ]);
    expect(jobs).not.toMatch(/ssh-action|kubectl|helm|workflow_run/);
    expect(jobs).not.toContain('secrets.');
  });
});
