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
  it('reports chart 3.0.3 and application 3.0.1 with an immutable default image', () => {
    const chart = YAML.parse(readFileSync('charts/dspace/Chart.yaml', 'utf8'));
    const values = YAML.parse(
      readFileSync('charts/dspace/values.yaml', 'utf8')
    );
    expect(chart.version).toBe('3.0.3');
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
    expect(deploymentEnv(manifest)).toContainEqual({
      name: 'METRICS_TOKEN',
      valueFrom: { fieldRef: { fieldPath: 'metadata.uid' } },
    });
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

  it('renders no ServiceMonitor or bearer-token reference with pure chart defaults', () => {
    const manifest = render();
    expect(manifest).not.toContain('kind: ServiceMonitor');
    expect(manifest).not.toContain('bearerTokenSecret');
  });
});

describe('chart 3.0.3 ServiceMonitor relabelings', () => {
  const authArgs = [
    '--set',
    'metrics.enabled=true',
    '--set',
    'metrics.auth.existingSecret=dspace-metrics-token', // scan-secrets: ignore (fixture Secret name)
    '--set',
    'serviceMonitor.enabled=true',
  ];

  it('renders exactly one ServiceMonitor with the expected name, labels, selector, and endpoint', () => {
    const manifest = render([
      ...authArgs,
      '--set',
      'environment=prod',
      '--set',
      'serviceMonitor.cluster=sugarkube-prod',
    ]);
    const serviceMonitors = documents(manifest).filter(
      (document) => document.kind === 'ServiceMonitor'
    );
    expect(serviceMonitors).toHaveLength(1);
    const [serviceMonitor] = serviceMonitors;
    expect(serviceMonitor.metadata.name).toBe('dspace');
    expect(serviceMonitor.metadata.namespace).toBeUndefined();
    expect(serviceMonitor.spec.selector.matchLabels).toMatchObject({
      'app.kubernetes.io/name': 'dspace',
      'app.kubernetes.io/instance': 'dspace',
    });
    expect(serviceMonitor.spec.namespaceSelector.matchNames).toEqual([
      'dspace',
    ]);
    const endpoint = serviceMonitor.spec.endpoints[0];
    expect(endpoint.port).toBe('http');
    expect(endpoint.path).toBe('/metrics');
    expect(endpoint.interval).toBe('30s');
    expect(endpoint.scrapeTimeout).toBe('10s');
    expect(endpoint.bearerTokenSecret).toEqual({
      name: 'dspace-metrics-token',
      key: 'token',
    });
  });

  it('orders the five built-in relabelings deterministically', () => {
    const manifest = render([
      ...authArgs,
      '--set',
      'environment=prod',
      '--set',
      'serviceMonitor.cluster=sugarkube-prod',
    ]);
    const serviceMonitor = documents(manifest).find(
      (document) => document.kind === 'ServiceMonitor'
    );
    expect(serviceMonitor.spec.endpoints[0].relabelings).toEqual([
      { action: 'replace', targetLabel: 'app', replacement: 'dspace' },
      { action: 'replace', targetLabel: 'environment', replacement: 'prod' },
      { action: 'replace', targetLabel: 'namespace', replacement: 'dspace' },
      { action: 'replace', targetLabel: 'release', replacement: 'dspace' },
      {
        action: 'replace',
        targetLabel: 'cluster',
        replacement: 'sugarkube-prod',
      },
    ]);
  });

  it('appends an operator-supplied relabeling after the five built-in rules', () => {
    const manifest = render([
      ...authArgs,
      '--set-json',
      'serviceMonitor.relabelings=[{"action":"labeldrop","regex":"pod_template_hash"}]',
    ]);
    const serviceMonitor = documents(manifest).find(
      (document) => document.kind === 'ServiceMonitor'
    );
    const { relabelings } = serviceMonitor.spec.endpoints[0];
    expect(relabelings).toHaveLength(6);
    expect(
      relabelings.slice(0, 5).map((rule: { targetLabel: string }) => rule.targetLabel)
    ).toEqual(['app', 'environment', 'namespace', 'release', 'cluster']);
    expect(relabelings[5]).toEqual({
      action: 'labeldrop',
      regex: 'pod_template_hash',
    });
  });

  it('never renders a raw bearer token, only a Secret reference', () => {
    const manifest = render(authArgs);
    expect(manifest).not.toMatch(/^\s*bearerToken:/m);
    expect(manifest).toContain('bearerTokenSecret');
  });

  it('fails closed when serviceMonitor.enabled is set without metrics.enabled', () => {
    expect(() => render(['--set', 'serviceMonitor.enabled=true'])).toThrow(
      /serviceMonitor\.enabled requires metrics\.enabled=true/
    );
  });

  it('fails closed when serviceMonitor.enabled is set without metrics.auth.existingSecret', () => {
    expect(() =>
      render([
        '--set',
        'metrics.enabled=true',
        '--set',
        'serviceMonitor.enabled=true',
      ])
    ).toThrow(/serviceMonitor\.enabled requires metrics\.auth\.existingSecret/);
  });

  it('fails closed when metrics.enabled is set without metrics.auth.existingSecret even without ServiceMonitor', () => {
    expect(() => render(['--set', 'metrics.enabled=true'])).toThrow(
      /metrics\.enabled=true requires metrics\.auth\.existingSecret/
    );
  });
});
