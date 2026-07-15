import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

describe('canonical dspace helm metrics contract', () => {
  const values = YAML.parse(read('charts/dspace/values.yaml'));
  const deployment = read('charts/dspace/templates/deployment.yaml');
  const serviceMonitor = read('charts/dspace/templates/servicemonitor.yaml');
  const ingress = read('charts/dspace/templates/ingress.yaml');
  const workflow = read('.github/workflows/ci-helm.yml');

  it('keeps default metrics and ServiceMonitor rendering disabled', () => {
    expect(values.metrics.enabled).toBe(false);
    expect(values.metrics.path).toBe('/metrics');
    expect(values.metrics.auth.existingSecret).toBe('');
    expect(values.metrics.auth.secretKey).toBe('token');
    expect(values.serviceMonitor.enabled).toBe(false);
  });

  it('uses a scrape timeout below the default interval', () => {
    expect(values.serviceMonitor.interval).toBe('30s');
    expect(values.serviceMonitor.scrapeTimeout).toBe('10s');
  });

  it('injects METRICS_TOKEN only from an existing Secret reference', () => {
    expect(deployment).toContain('name: METRICS_TOKEN');
    expect(deployment).toContain('secretKeyRef:');
    expect(deployment).toContain(
      'name: {{ .Values.metrics.auth.existingSecret | quote }}'
    );
    expect(deployment).toContain(
      'key: {{ .Values.metrics.auth.secretKey | quote }}'
    );
  });

  it('renders one ServiceMonitor gated by explicit metrics and ServiceMonitor enablement', () => {
    expect(serviceMonitor).toContain(
      'if and .Values.serviceMonitor.enabled .Values.metrics.enabled'
    );
    expect(serviceMonitor.match(/kind: ServiceMonitor/g)).toHaveLength(1);
    expect(serviceMonitor).toContain(
      'fail "metrics.auth.existingSecret is required'
    );
  });

  it('selects only the DSPACE Service for the Helm release', () => {
    expect(serviceMonitor).toContain('selector:');
    expect(serviceMonitor).toContain('matchLabels:');
    expect(serviceMonitor).toContain('include "dspace.selectorLabels"');
    expect(serviceMonitor).toContain('matchNames:');
    expect(serviceMonitor).toContain('{{ .Release.Namespace }}');
  });

  it('scrapes the named application port and metrics path with bearer authorization', () => {
    expect(serviceMonitor).toContain('port: http');
    expect(serviceMonitor).toContain(
      'path: {{ .Values.metrics.path | quote }}'
    );
    expect(serviceMonitor).toContain('authorization:');
    expect(serviceMonitor).toContain('type: Bearer');
    expect(serviceMonitor).toContain('credentials:');
  });

  it('preserves bounded discovery labels and target metadata hooks', () => {
    expect(values.serviceMonitor.additionalLabels.release).toBe(
      'kube-prometheus-stack'
    );
    for (const label of [
      'app',
      'namespace',
      'environment',
      'release',
      'cluster',
    ]) {
      expect(serviceMonitor).toContain(`targetLabel: ${label}`);
    }
    expect(serviceMonitor).toContain('targetLabels:');
    expect(serviceMonitor).toContain('relabelings:');
  });

  it('does not add a public metrics ingress or observability UI exposure', () => {
    expect(ingress).not.toMatch(/metrics|prometheus|grafana/i);
    expect(serviceMonitor).not.toMatch(/kind: Ingress/);
  });

  it('keeps canonical chart publishing pointed at charts/dspace', () => {
    expect(workflow).toContain('helm package charts/dspace');
    expect(workflow).toContain('helm lint charts/dspace');
  });
});
