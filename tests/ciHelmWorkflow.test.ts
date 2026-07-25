import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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
    expect(workflow.concurrency.group).toContain('github.ref_name');
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
    expect(release.env.EVENT_SHA).toBe('${{ github.sha }}');
    expect(release.run).toContain('git rev-parse HEAD');
    expect(release.run).toContain('git rev-parse "${EVENT_SHA}^{commit}"');
    expect(release.run).toContain('git rev-parse "${CHART_TAG}^{commit}"');
    expect(release.run).toContain('"$source_sha" == "$event_sha"');
    expect(release.run).toContain('"$tag_sha" == "$event_sha"');
  });

  it('enforces strict matching versions and tombstones chart 3.0.1 before registry access', () => {
    const releaseIndex = steps.indexOf(
      step('Validate tag, versions, and source revision')
    );
    const guardIndex = steps.indexOf(
      step('Refuse an existing chart coordinate (pre-package)')
    );
    expect(steps[releaseIndex].run).toContain(
      '^[[0-9]+\\.[0-9]+\\.[0-9]+$'.replace('[', '')
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
      'Chart release tag',
      'Full source SHA',
      'Source repository',
      'OCI reference',
      'Packaged archive SHA-256',
      'OCI manifest digest',
    ]) {
      expect(summary).toContain(field);
    }
  });

  it('keeps credentials in environment variables and stdin', () => {
    expect(text).not.toContain('-p "${{ secrets.GITHUB_TOKEN }}"');
    expect(step('Authenticate to GHCR').run).toContain('--password-stdin');
  });
});
