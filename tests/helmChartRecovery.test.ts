import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const render = (args: string[] = []) =>
  execFileSync(
    'helm',
    ['template', 'dspace', 'charts/dspace', '--namespace', 'dspace', ...args],
    { encoding: 'utf8' }
  );

const documents = (manifest: string) =>
  manifest
    .split(/^---$/m)
    .map((document) => document.trim())
    .filter(Boolean)
    .map((document) => YAML.parse(document));

const deploymentEnv = (manifest: string) =>
  documents(manifest).find((document) => document.kind === 'Deployment').spec
    .template.spec.containers[0].env;

describe('v3.0.1-compatible recovery chart', () => {
  it('reports chart 3.0.2 and application 3.0.1 with an immutable default image', () => {
    const chart = YAML.parse(readFileSync('charts/dspace/Chart.yaml', 'utf8'));
    const values = YAML.parse(
      readFileSync('charts/dspace/values.yaml', 'utf8')
    );
    expect(chart.version).toBe('3.0.2');
    expect(String(chart.appVersion)).toBe('3.0.1');
    expect(values.image.tag).toBe('main-1a31a56');
    expect(values.image.tag).not.toBe('v3.0.1');
    expect(render()).toContain('ghcr.io/democratizedspace/dspace:main-1a31a56');
  });

  it('renders stored pre-observability production values with an immutable override', () => {
    const manifest = render([
      '-f',
      'tests/fixtures/helm/dspace-v3.0.1-production-values.yaml',
      '--set-string',
      'image.tag=main-1a31a56',
    ]);
    expect(manifest).toContain('ghcr.io/democratizedspace/dspace:main-1a31a56');
    expect(manifest).not.toContain('kind: ServiceMonitor');
    expect(deploymentEnv(manifest)).toContainEqual({
      name: 'METRICS_ENABLED',
      value: 'false',
    });
  });

  it('safely renders explicitly null metrics-related maps', () => {
    const manifest = render([
      '-f',
      'tests/fixtures/helm/dspace-v3.0.1-null-metrics-values.yaml',
    ]);
    expect(manifest).not.toContain('kind: ServiceMonitor');
    expect(manifest).not.toContain('METRICS_TOKEN');
    expect(deploymentEnv(manifest)).toContainEqual({
      name: 'METRICS_ENABLED',
      value: 'false',
    });
  });

  it('renders authenticated metrics and its existing Secret reference only when enabled', () => {
    const manifest = render([
      '--set',
      'metrics.enabled=true',
      '--set',
      'metrics.auth.existingSecret=dspace-metrics-token', // scan-secrets: ignore (fixture Secret name)
      '--set',
      'serviceMonitor.enabled=true',
    ]);
    const serviceMonitor = documents(manifest).find(
      (document) => document.kind === 'ServiceMonitor'
    );
    expect(serviceMonitor.spec.endpoints[0].bearerTokenSecret).toEqual({
      name: 'dspace-metrics-token',
      key: 'token',
    });
    expect(deploymentEnv(manifest)).toContainEqual({
      name: 'METRICS_TOKEN',
      valueFrom: {
        secretKeyRef: { name: 'dspace-metrics-token', key: 'token' },
      },
    });
  });
});
