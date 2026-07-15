import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseAllDocuments } from 'yaml';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const chartPath = join(repoRoot, 'charts', 'dspace');

function helmAvailable() {
  try {
    execFileSync('helm', ['version', '--short'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function render(extraValues = '') {
  if (!helmAvailable()) return [] as any[];
  const args = ['template', 'dspace', chartPath, '--namespace', 'dspace'];
  if (extraValues) {
    const dir = mkdtempSync(join(tmpdir(), 'dspace-chart-'));
    const file = join(dir, 'values.yaml');
    writeFileSync(file, extraValues);
    args.push('-f', file);
  }
  const output = execFileSync('helm', args, { encoding: 'utf8' });
  return parseAllDocuments(output)
    .map((doc) => doc.toJSON())
    .filter(Boolean) as any[];
}

describe('canonical dspace Helm metrics scrape contract', () => {
  it('declares safe disabled-by-default metrics and ServiceMonitor values', () => {
    const values = readFileSync(join(chartPath, 'values.yaml'), 'utf8');
    expect(values).toMatch(/metrics:\n\s+enabled: false\n\s+path: \/metrics/);
    expect(values).toMatch(/auth:\n\s+existingSecret: ""\n\s+secretKey: token/);
    expect(values).toMatch(
      /serviceMonitor:\n\s+enabled: false\n\s+interval: 30s\n\s+scrapeTimeout: 10s/
    );
    expect(values).toMatch(
      /additionalLabels:\n\s+release: kube-prometheus-stack/
    );
    expect(existsSync(join(chartPath, 'values.schema.json'))).toBe(true);
  });

  it('uses Prometheus Operator authorization Secret wiring and no inline token values', () => {
    const serviceMonitor = readFileSync(
      join(chartPath, 'templates', 'servicemonitor.yaml'),
      'utf8'
    );
    expect(serviceMonitor).toContain('authorization:');
    expect(serviceMonitor).toContain('credentials:');
    expect(serviceMonitor).toContain(
      'name: {{ .Values.metrics.auth.existingSecret | quote }}'
    );
    expect(serviceMonitor).toContain(
      'key: {{ .Values.metrics.auth.secretKey | quote }}'
    );
    expect(serviceMonitor).not.toContain('bearerToken:');
    expect(serviceMonitor).not.toContain('bearerTokenSecret:');
  });

  it('injects METRICS_TOKEN only from an existing SecretKeyRef', () => {
    const deployment = readFileSync(
      join(chartPath, 'templates', 'deployment.yaml'),
      'utf8'
    );
    expect(deployment).toContain('METRICS_TOKEN');
    expect(deployment).toContain('secretKeyRef:');
    expect(deployment).toContain(
      'name: {{ .Values.metrics.auth.existingSecret | quote }}'
    );
    expect(deployment).toContain(
      'key: {{ .Values.metrics.auth.secretKey | quote }}'
    );
    expect(deployment).not.toMatch(/METRICS_TOKEN[\s\S]{0,120}value:/);
  });

  it('documents local disabled and Sugarkube staging examples plus verification commands', () => {
    const docs = readFileSync(join(repoRoot, 'docs', 'charts.md'), 'utf8');
    expect(docs).toContain('`metrics.enabled`:');
    expect(docs).toContain('dspace-metrics-token-example');
    expect(docs).toContain(
      'curl -fsS -H "Authorization: Bearer ${METRICS_TOKEN}"'
    );
    expect(docs).toContain(
      'curl -i https://dspace-staging.example.com/metrics'
    );
  });

  it('renders exactly one secure ServiceMonitor and no metrics Ingress when enabled', () => {
    const manifests = render(
      `metrics:\n  enabled: true\n  auth:\n    existingSecret: dspace-metrics-token-example\nserviceMonitor:\n  enabled: true\n  cluster: sugarkube-staging\ningress:\n  enabled: true\n  host: dspace-staging.example.com\n`
    );
    if (manifests.length === 0) return;
    const serviceMonitors = manifests.filter(
      (manifest) => manifest.kind === 'ServiceMonitor'
    );
    expect(serviceMonitors).toHaveLength(1);
    const serviceMonitor = serviceMonitors[0];
    expect(serviceMonitor.metadata.labels.release).toBe(
      'kube-prometheus-stack'
    );
    expect(serviceMonitor.spec.selector.matchLabels).toEqual({
      'app.kubernetes.io/name': 'dspace',
      'app.kubernetes.io/instance': 'dspace',
    });
    expect(serviceMonitor.spec.endpoints[0]).toMatchObject({
      port: 'http',
      path: '/metrics',
      interval: '30s',
      scrapeTimeout: '10s',
      authorization: {
        type: 'Bearer',
        credentials: { name: 'dspace-metrics-token-example', key: 'token' },
      },
    });
    const ingresses = manifests.filter(
      (manifest) => manifest.kind === 'Ingress'
    );
    expect(ingresses).toHaveLength(1);
    expect(ingresses[0].metadata.name).toBe('dspace');
  });
});
