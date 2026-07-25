import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { parse } from 'yaml';

const text = readFileSync(
  join(process.cwd(), '.github/workflows/ci-helm.yml'),
  'utf8'
);
const workflow = parse(text) as any;
const job = workflow.jobs.publish;
const steps = job.steps as any[];
const step = (name: string) =>
  steps.find((candidate) => candidate.name === name);

describe('chart publication workflow integrity', () => {
  it('publishes only for chart-v* tag pushes, never branches or manual dispatch', () => {
    expect(workflow.on).toEqual({ push: { tags: ['chart-v*'] } });
    expect(text).not.toContain('workflow_dispatch');
    expect(text).not.toMatch(/branches:\s*\n\s*- (main|v3)/);
  });

  it('serializes same-tag runs without cancellation', () => {
    expect(workflow.concurrency.group).toBe('helm-chart-${{ github.ref }}');
    expect(workflow.concurrency['cancel-in-progress']).toBe(false);
  });

  it('binds checkout to the event SHA and rejects a subsequently moved tag', () => {
    const checkout = steps.find((candidate) =>
      candidate.uses?.startsWith('actions/checkout')
    );
    expect(checkout.with.ref).toBe('${{ github.sha }}');
    expect(checkout.with['fetch-depth']).toBe(0);
    const release = step('Validate tag, versions, and source revision');
    expect(release.env.CHART_TAG).toBe('${{ github.ref_name }}');
    expect(text.match(/github\.ref_name/g)).toHaveLength(1);
    expect(release.env.EVENT_SHA).toBe('${{ github.sha }}');
    expect(release.run).toContain('git rev-parse HEAD');
    expect(release.run).toContain('git rev-parse "${CHART_TAG}^{commit}"');
    expect(release.run).toContain('"$source_sha" == "$EVENT_SHA"');
    expect(release.run).toContain('"$source_sha" == "$tag_sha"');
  });

  it('enforces strict matching versions and tombstones chart 3.0.1 before registry access', () => {
    const releaseIndex = steps.indexOf(
      step('Validate tag, versions, and source revision')
    );
    const guardIndex = steps.indexOf(
      step('Refuse an existing chart coordinate (pre-package)')
    );
    expect(steps[releaseIndex].run).toContain(
      '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$'
    );
    expect(steps[releaseIndex].run).toContain('chart-v${chart_version}');
    expect(steps[releaseIndex].run).toContain('chart_version" != "3.0.1');
    expect(releaseIndex).toBeLessThan(guardIndex);
  });

  it('targets the chart repository twice, before packaging and immediately before push', () => {
    const guards = steps.filter((candidate) =>
      candidate.run?.includes('check-absent')
    );
    expect(guards).toHaveLength(2);
    for (const guard of guards) {
      expect(guard.run).toContain('--repo charts/dspace');
      expect(guard.run).toContain('--tag "$CHART_VERSION"');
      expect(guard.env.GHCR_GUARD_PASSWORD).toBe('${{ secrets.GITHUB_TOKEN }}');
    }
    const packageIndex = steps.indexOf(
      step('Validate and stage chart provenance')
    );
    const pushIndex = steps.indexOf(step('Push chart exactly once'));
    expect(steps.indexOf(guards[0])).toBeLessThan(packageIndex);
    expect(steps.indexOf(guards[1])).toBe(pushIndex - 1);
  });

  it('has one unsuppressed helm push and records validated provenance evidence', () => {
    expect(text.match(/^\s*output=\$\(helm push /gm)).toHaveLength(1);
    const push = step('Push chart exactly once').run;
    expect(push).not.toMatch(/retry|continue-on-error|\|\| true/);
    expect(push).toContain('^sha256:[0-9a-f]{64}$');
    const summary = step('Write publication evidence').run;
    for (const field of [
      'Chart version',
      'Application version',
      'Triggering chart release tag',
      'Full source SHA',
      'Source repository',
      'OCI reference',
      'Packaged archive SHA-256',
      'OCI manifest digest',
    ]) {
      expect(summary).toContain(field);
    }
    expect(summary).toContain(
      'SOURCE_SHA is the authoritative immutable provenance'
    );
  });

  it('keeps credentials in environment variables and stdin', () => {
    expect(text).not.toContain('-p "${{ secrets.GITHUB_TOKEN }}"');
    expect(step('Authenticate to GHCR').run).toContain('--password-stdin');
    expect(step('Authenticate to GHCR').env).toEqual({
      GHCR_GUARD_USERNAME: '${{ github.actor }}',
      GHCR_GUARD_PASSWORD: '${{ secrets.GITHUB_TOKEN }}', // scan-secrets: ignore -- workflow expression, not a credential
    });
  });

  it('installs Node and YAML dependencies before staging', () => {
    expect(step('Setup Node.js').with['node-version']).toBe(20);
    expect(step('Setup pnpm').with.version).toBe('9.0.0');
    expect(step('Install dependencies').run).toBe(
      'pnpm install --frozen-lockfile --reporter=append-only'
    );
    expect(steps.indexOf(step('Install dependencies'))).toBeLessThan(
      steps.indexOf(step('Validate and stage chart provenance'))
    );
  });

  it('verifies the safely extracted packaged Chart.yaml with the YAML helper', () => {
    const packaging = step('Validate and stage chart provenance').run;
    expect(packaging).toContain('tar -xOf "$expected" dspace/Chart.yaml');
    expect(packaging).toContain('stage-helm-chart.mjs verify');
    expect(packaging).not.toContain('value()');
  });
});

describe('immutable chart tag peeling', () => {
  const withRepository = (
    run: (root: string, first: string, second: string) => void
  ) => {
    const root = mkdtempSync(join(tmpdir(), 'helm-tag-'));
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    try {
      git('init', '-q');
      git('config', 'user.name', 'Test');
      git('config', 'user.email', 'test@example.invalid');
      execFileSync(
        'sh',
        ['-c', 'echo one > file && git add file && git commit -qm one'],
        { cwd: root }
      );
      const first = git('rev-parse', 'HEAD');
      execFileSync('sh', ['-c', 'echo two > file && git commit -qam two'], {
        cwd: root,
      });
      run(root, first, git('rev-parse', 'HEAD'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
  const validate = (root: string, eventSha: string, tag: string) =>
    spawnSync(
      'bash',
      [
        '-c',
        'source_sha=$(git rev-parse HEAD); tag_sha=$(git rev-parse "${CHART_TAG}^{commit}"); [[ "$source_sha" == "$EVENT_SHA" && "$source_sha" == "$tag_sha" ]]',
      ],
      {
        cwd: root,
        env: { ...process.env, EVENT_SHA: eventSha, CHART_TAG: tag },
      }
    );

  it.each([['lightweight'], ['annotated']])(
    'peels a %s tag to the event commit',
    (kind) =>
      withRepository((root, first) => {
        const args =
          kind === 'annotated'
            ? ['tag', '-a', 'chart-v1.2.3', '-m', 'release', first]
            : ['tag', 'chart-v1.2.3', first];
        execFileSync('git', args, { cwd: root });
        execFileSync('git', ['checkout', '-q', first], { cwd: root });
        expect(validate(root, first, 'chart-v1.2.3').status).toBe(0);
      })
  );

  it('rejects a tag moved away from the checked-out event commit', () =>
    withRepository((root, first, second) => {
      execFileSync('git', ['tag', 'chart-v1.2.3', second], { cwd: root });
      execFileSync('git', ['checkout', '-q', first], { cwd: root });
      expect(validate(root, first, 'chart-v1.2.3').status).not.toBe(0);
    }));
});
