import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  join(process.cwd(), '.github/workflows/ci-helm.yml'),
  'utf8'
);

describe('Helm publication workflow integrity', () => {
  it('can only be triggered by chart release tags', () => {
    expect(workflow).toMatch(/push:\n\s+tags:\n\s+- chart-v\*/);
    expect(workflow).not.toContain('branches:');
    expect(workflow).not.toContain('workflow_dispatch:');
    expect(workflow).not.toContain('release:');
  });

  it('validates exact coordinates, tombstones 3.0.1, and resolves tags to HEAD', () => {
    expect(workflow).toContain(
      '[[ "$CHART_TAG" == "chart-v${chart_version}" ]]'
    );
    expect(workflow).toContain('[[ "$chart_version" != \'3.0.1\' ]]');
    expect(workflow).toContain('source_sha=$(git rev-parse HEAD)');
    expect(workflow).toContain(
      'tag_sha=$(git rev-parse "${CHART_TAG}^{commit}")'
    );
    expect(workflow).toContain('fetch-depth: 0');
  });

  it('serializes same-tag runs without cancellation', () => {
    expect(workflow).toContain('group: helm-chart-${{ github.ref_name }}');
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('guards the chart coordinate twice around packaging and pushes exactly once', () => {
    const guards = [...workflow.matchAll(/ghcr-manifest\.mjs check-absent/g)];
    expect(guards).toHaveLength(2);
    expect(workflow.match(/helm push/g)).toHaveLength(1);
    expect(workflow).not.toContain('continue-on-error');
    const packageIndex = workflow.indexOf('Stage, lint, and package chart');
    expect(guards[0].index).toBeLessThan(packageIndex);
    expect(guards[1].index).toBeGreaterThan(packageIndex);
    const finalGuardStep = workflow.indexOf(
      '- name: Final fail-closed coordinate guard'
    );
    const pushStep = workflow.indexOf('- name: Push chart to GHCR once');
    expect(
      workflow.slice(finalGuardStep, pushStep).match(/- name:/g)
    ).toHaveLength(1);
    expect(workflow.match(/--repo charts\/dspace/g)).toHaveLength(3);
  });

  it('keeps credentials in environment variables and records validated evidence', () => {
    expect(workflow).toContain(
      'GHCR_GUARD_PASSWORD: ${{ secrets.GITHUB_TOKEN }}'
    );
    expect(workflow).toContain('--password-stdin');
    expect(workflow).not.toMatch(/(?:--password|-p) "?\$\{\{ secrets/);
    expect(workflow).toContain('^sha256:[0-9a-f]{64}$');
    for (const field of [
      'Chart version:',
      'Application version:',
      'Chart release tag:',
      'Full source SHA:',
      'Source repository:',
      'OCI reference:',
      'Packaged archive SHA-256:',
      'OCI manifest digest:',
    ])
      expect(workflow).toContain(field);
  });
});
