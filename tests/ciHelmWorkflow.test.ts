import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/ci-helm.yml', 'utf8');

describe('immutable Helm chart publication workflow', () => {
  it('is triggered only by chart-specific tags, never branches or manual dispatch', () => {
    expect(workflow).toMatch(/push:\n\s+tags:\n\s+- 'chart-v\*'/);
    expect(workflow).not.toMatch(/branches:|workflow_dispatch:|release:/);
  });

  it('checks out and verifies the triggering tag commit with full history', () => {
    expect(workflow).toContain('ref: ${{ github.ref }}');
    expect(workflow).toContain('fetch-depth: 0');
    expect(workflow).toContain('source_revision=$(git rev-parse HEAD)');
    expect(workflow).toContain(
      'tag_revision=$(git rev-parse "${CHART_TAG}^{commit}")'
    );
    expect(workflow).toContain('[[ "$source_revision" == "$tag_revision" ]]');
    expect(workflow).toContain('CHART_TAG: ${{ github.ref_name }}');
  });

  it('serializes same-tag runs without cancelling an active publication', () => {
    expect(workflow).toContain('group: helm-chart-${{ github.ref_name }}');
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('guards the charts/dspace coordinate before packaging and immediately before one push', () => {
    const guards = [
      ...workflow.matchAll(
        /ghcr-manifest\.mjs check-absent --owner democratizedspace --repo charts\/dspace/g
      ),
    ];
    expect(guards).toHaveLength(2);
    const packageAt = workflow.indexOf('helm package');
    const pushAt = workflow.indexOf('helm push');
    expect(guards[0].index).toBeLessThan(packageAt);
    expect(guards[1].index).toBeGreaterThan(packageAt);
    expect(guards[1].index).toBeLessThan(pushAt);
    expect(workflow.match(/push_output=\$\(helm push/g)).toHaveLength(1);
    expect(workflow).not.toMatch(/continue-on-error|retry|--password\s/);
  });

  it('stages provenance, validates both digests, and records complete evidence', () => {
    expect(workflow).toContain('helm-chart-release.mjs stage');
    expect(workflow).toContain('helm-chart-release.mjs verify-package');
    expect(
      workflow.match(/helm-chart-release\.mjs validate-digest/g)
    ).toHaveLength(2);
    for (const field of [
      'Chart version:',
      'appVersion:',
      'Chart release tag:',
      'Full source SHA:',
      'Source repository:',
      'OCI reference:',
      'Packaged archive SHA-256:',
      'OCI manifest digest:',
    ])
      expect(workflow).toContain(field);
    expect(workflow).toContain(
      'git diff --exit-code -- charts/dspace/Chart.yaml'
    );
  });

  it('passes registry credentials only through guarded environment variables', () => {
    expect(workflow.match(/GHCR_GUARD_USERNAME:/g)).toHaveLength(2);
    expect(workflow.match(/GHCR_GUARD_PASSWORD:/g)).toHaveLength(2); // scan-secrets: ignore (asserts an environment variable name, not a credential)
    expect(workflow).not.toMatch(/ghcr-manifest\.mjs[^\n]*(password|username)/);
  });
});
