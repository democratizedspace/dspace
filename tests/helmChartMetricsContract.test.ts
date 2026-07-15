import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const repoRoot = join(__dirname, '..');
const valuesYaml = readFileSync(join(repoRoot, 'charts', 'dspace', 'values.yaml'), 'utf8');
const values = parse(valuesYaml) as {
  metrics: { enabled: boolean; path: string; auth: { existingSecret: string; secretKey: string } };
  serviceMonitor: {
    enabled: boolean;
    interval: string;
    scrapeTimeout: string;
    additionalLabels: Record<string, string>;
    relabelings: unknown[];
  };
};
const serviceMonitorTemplate = readFileSync(
  join(repoRoot, 'charts', 'dspace', 'templates', 'servicemonitor.yaml'),
  'utf8',
);
const deploymentTemplate = readFileSync(
  join(repoRoot, 'charts', 'dspace', 'templates', 'deployment.yaml'),
  'utf8',
);
const ingressTemplate = readFileSync(
  join(repoRoot, 'charts', 'dspace', 'templates', 'ingress.yaml'),
  'utf8',
);
const schema = JSON.parse(
  readFileSync(join(repoRoot, 'charts', 'dspace', 'values.schema.json'), 'utf8'),
) as Record<string, unknown>;

describe('canonical Helm metrics scrape contract', () => {
  it('keeps metrics and ServiceMonitor rendering disabled by default', () => {
    expect(values.metrics.enabled).toBe(false);
    expect(values.metrics.path).toBe('/metrics');
    expect(values.metrics.auth).toMatchObject({ existingSecret: '', secretKey: 'token' });
    expect(values.serviceMonitor.enabled).toBe(false);
    expect(values.serviceMonitor.interval).toBe('30s');
    expect(values.serviceMonitor.scrapeTimeout).toBe('10s');
  });

  it('documents the Sugarkube kube-prometheus-stack release label without embedding token values', () => {
    expect(values.serviceMonitor.additionalLabels).toMatchObject({
      release: 'kube-prometheus-stack',
    });
    expect(valuesYaml).not.toMatch(/METRICS_TOKEN:\s*[^\s{]/);
  });

  it('injects METRICS_TOKEN only from an existing Secret key reference', () => {
    expect(deploymentTemplate).toContain('if and .Values.metrics.enabled .Values.metrics.auth.existingSecret');
    expect(deploymentTemplate).toContain('name: METRICS_TOKEN');
    expect(deploymentTemplate).toContain('secretKeyRef:');
    expect(deploymentTemplate).toContain('name: {{ .Values.metrics.auth.existingSecret | quote }}');
    expect(deploymentTemplate).toContain('key: {{ .Values.metrics.auth.secretKey | quote }}');
  });

  it('renders exactly one ServiceMonitor template gated by explicit metrics and ServiceMonitor enablement', () => {
    expect(serviceMonitorTemplate).toMatch(/if and \.Values\.metrics\.enabled \.Values\.serviceMonitor\.enabled/);
    expect(serviceMonitorTemplate.match(/kind: ServiceMonitor/g)).toHaveLength(1);
  });

  it('selects only the DSPACE Service for the release and uses supported authorization credentials', () => {
    expect(serviceMonitorTemplate).toContain('matchLabels:');
    expect(serviceMonitorTemplate).toContain('include "dspace.selectorLabels"');
    expect(serviceMonitorTemplate).toContain('port: http');
    expect(serviceMonitorTemplate).toContain('path: {{ .Values.metrics.path | quote }}');
    expect(serviceMonitorTemplate).toContain('authorization:');
    expect(serviceMonitorTemplate).toContain('type: Bearer');
    expect(serviceMonitorTemplate).toContain('credentials:');
  });

  it('preserves bounded target metadata and does not define a public metrics ingress', () => {
    for (const label of ['app', 'namespace', 'environment', 'release', 'cluster']) {
      expect(serviceMonitorTemplate).toContain(`targetLabel: ${label}`);
    }
    expect(ingressTemplate).not.toMatch(/metrics|ServiceMonitor|Prometheus|Grafana/i);
  });

  it('extends the values schema for metrics and ServiceMonitor values', () => {
    expect(JSON.stringify(schema)).toContain('serviceMonitor');
    expect(JSON.stringify(schema)).toContain('existingSecret');
    expect(JSON.stringify(schema)).toContain('additionalLabels');
  });
});
