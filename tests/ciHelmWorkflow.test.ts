import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  join(process.cwd(), '.github/workflows/ci-helm.yml'),
  'utf8'
);

describe('Helm publication workflow integrity', () => {
  it('has only the chart-specific tag trigger, not branches, dispatch, or releases', () => {
    expect(workflow).toMatch(/push:\n\s+tags:\n\s+- chart-v\*/);
    expect(workflow).not.toMatch(/branches:|workflow_dispatch:|release:/);
  });

  it('validates the attacker-controlled tag via environment and resolves annotated or lightweight tags', () => {
    expect(workflow).toContain('CHART_TAG: ${{ github.ref_name }}');
    expect(workflow).toContain('"$CHART_TAG" == "chart-v${chart_version}"');
    expect(workflow).toContain('git rev-parse "${CHART_TAG}^{commit}"');
    expect(workflow).toContain('source_sha=$(git rev-parse HEAD)');
    expect(workflow).toContain('fetch-depth: 0');
    expect(workflow).not.toContain('${{ github.ref_name }}^{commit}');
  });

  it('tombstones 3.0.1 before both fail-closed checks against the chart repository', () => {
    const tombstone = workflow.indexOf('chart_version" != "3.0.1');
    const packageStep = workflow.indexOf('Stage, lint, and package chart');
    const checks = [
      ...workflow.matchAll(
        /ghcr-manifest\.mjs check-absent --owner democratizedspace --repo charts\/dspace/g
      ),
    ].map((m) => m.index!);
    expect(checks).toHaveLength(2);
    expect(tombstone).toBeLessThan(checks[0]);
    expect(checks[0]).toBeLessThan(packageStep);
    expect(checks[1]).toBeGreaterThan(packageStep);
    expect(
      workflow.slice(checks[1], workflow.indexOf('Push chart to GHCR once'))
    ).not.toContain('helm package');
  });

  it('serializes same-tag runs without cancellation and pushes exactly once without suppression', () => {
    expect(workflow).toContain('group: helm-chart-${{ github.ref_name }}');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow.match(/helm push/g)).toHaveLength(1);
    expect(workflow).not.toMatch(/continue-on-error|\|\|\s*true|retry/);
  });

  it('stages provenance, validates digests, summarizes evidence, and keeps credentials out of arguments', () => {
    expect(workflow).toContain('helm-chart-provenance.mjs stage');
    expect(workflow).toContain('helm-chart-provenance.mjs verify');
    expect(workflow).toContain('sha256sum charts/dspace/Chart.yaml');
    expect(workflow.match(/\^sha256:\[0-9a-f\]\{64\}\$/g)).toHaveLength(4);
    expect(workflow).toContain('steps.push.outputs.reported_digest');
    for (const field of [
      'Chart version',
      'appVersion',
      'Chart release tag',
      'Full source SHA',
      'Source repository',
      'OCI reference',
      'Packaged archive SHA-256',
      'OCI manifest digest',
    ]) {
      expect(workflow).toContain(field);
    }
    expect(workflow).toContain('--password-stdin');
    expect(workflow).not.toContain('-p "${{ secrets.GITHUB_TOKEN }}"');
  });
});
