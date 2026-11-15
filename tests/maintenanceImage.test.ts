import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import {
  policy,
  hasOwnerReviewWaiver,
  validateRequest,
  validateEvidence,
  assertAbsent,
  latestStatuses,
  validatePublishedIndex,
} from '../scripts/maintenance-image.mjs';

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
  comments: [] as Array<{ id: number; user: { login: string }; body: string }>,
  reviews: [] as Array<{
    id: number;
    user: { login: string };
    state: string;
    body: string;
    commit_id: string;
  }>,
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
  it('accepts the exact owner-waived date source with no completed AI reviews', () => {
    expect(() => validateEvidence(evidence())).not.toThrow();
    expect(hasOwnerReviewWaiver(evidence().pr, policy.tree)).toBe(true);
  });
  it('never transfers the review waiver to another PR, head or tree', () => {
    const e = evidence();
    expect(hasOwnerReviewWaiver({ ...e.pr, number: 4870 }, e.tree)).toBe(false);
    expect(
      hasOwnerReviewWaiver({ ...e.pr, head: { sha: 'a'.repeat(40) } }, e.tree)
    ).toBe(false);
    expect(hasOwnerReviewWaiver(e.pr, 'a'.repeat(40))).toBe(false);
  });
  it.each([42994229967, 42994228265])(
    'does not inherit historical run waiver %s',
    (id) => {
      const e = evidence();
      e.runs[0] = { ...e.runs[0], id, conclusion: 'failure', jobCount: 0 };
      expect(() => validateEvidence(e)).toThrow('Unwaived workflow failure');
    }
  );
  it('does not ignore unresolved Codex findings', () => {
    const e = evidence();
    e.comments.push({
      id: 1,
      user: { login: 'chatgpt-codex-connector[bot]' },
      body: '<!-- codex-review-state:v1 {"code_review":{"has_unresolved_findings":true}} -->',
    });
    expect(() => validateEvidence(e)).toThrow('Unresolved Codex finding');
  });
  it('accepts the actual clear #4876 summaries without requiring their presence', () => {
    const captured = JSON.parse(
      readFileSync('tests/fixtures/maintenanceNovember15Reviews.json', 'utf8')
    ).summaries;
    const e = evidence();
    e.comments.push(
      captured.find((c) => c.user.login === 'greptile-apps[bot]')
    );
    e.reviews.push(
      captured.find(
        (c) => c.user.login === 'copilot-pull-request-reviewer[bot]'
      )
    );
    expect(() => validateEvidence(e)).not.toThrow();
  });
  it.each(['greptile-apps[bot]', 'copilot-pull-request-reviewer[bot]'])(
    'rejects changed or newer %s summaries even if they quote an earlier clear review',
    (login) => {
      const captured = JSON.parse(
        readFileSync('tests/fixtures/maintenanceNovember15Reviews.json', 'utf8')
      ).summaries.find((c) => c.user.login === login);
      for (const change of [
        {
          body: captured.body + '\nNew blocking security finding; do not merge',
        },
        { id: captured.id + 1 },
        { body: captured.body.replace('November 15', 'November 11') },
      ]) {
        const e = evidence();
        const records = login === 'greptile-apps[bot]' ? e.comments : e.reviews;
        records.push({ ...captured, ...change });
        expect(() => validateEvidence(e)).toThrow('findings; inspect');
      }
    }
  );
  it('rejects the actual historical Copilot COMMENTED one-open-issue finding', () => {
    const captured = JSON.parse(
      readFileSync('tests/fixtures/maintenanceReviews.json', 'utf8')
    );
    const finding = captured.reviews.find((r) =>
      r.body.includes('1 open issue')
    );
    expect(finding).toBeDefined();
    const e = evidence();
    e.reviews.push({ ...finding, commit_id: policy.source });
    expect(() => validateEvidence(e)).toThrow('findings; inspect');
  });
  it('does not clear requested changes with a later comment', () => {
    const e = evidence();
    const review = {
      id: 1,
      user: { login: 'reviewer' },
      state: 'CHANGES_REQUESTED',
      body: '',
      commit_id: policy.source,
    };
    e.reviews.push(review, { ...review, id: 2, state: 'COMMENTED' });
    expect(() => validateEvidence(e)).toThrow('Outstanding requested changes');
    e.reviews.push({ ...review, id: 3, state: 'APPROVED' });
    expect(() => validateEvidence(e)).not.toThrow();
  });
  it('allows pending review completion, but rejects a dismissed review', () => {
    const e = evidence();
    e.reviews.push({
      id: 1,
      user: { login: 'copilot-pull-request-reviewer[bot]' },
      state: 'PENDING',
      body: '',
      commit_id: policy.source,
    });
    expect(() => validateEvidence(e)).not.toThrow();
    e.reviews[0].state = 'DISMISSED';
    expect(() => validateEvidence(e)).toThrow();
  });
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
