import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

function render(args: string[] = []) {
    return execFileSync(
        'helm',
        ['template', 'dspace', 'charts/dspace', '--namespace', 'dspace', ...args],
        {
            encoding: 'utf8',
        }
    );
}

function docs(manifest: string) {
    return manifest
        .split(/^---$/m)
        .map((doc) => doc.trim())
        .filter(Boolean)
        .map((doc) => YAML.parse(doc));
}

describe('canonical dspace helm chart metrics contract', () => {
    it('does not render metrics Secret references or a ServiceMonitor by default', () => {
        const manifest = render();
        expect(manifest).not.toContain('kind: ServiceMonitor');
        expect(manifest).not.toContain('METRICS_TOKEN');
        expect(manifest).not.toContain('bearerTokenSecret');
    });

    it('renders exactly one authenticated ServiceMonitor when explicitly enabled', () => {
        const manifest = render([
            '--set',
            'metrics.enabled=true',
            '--set',
            'metrics.auth.existingSecret=dspace-staging-metrics-token',
            '--set',
            'serviceMonitor.enabled=true',
            '--set',
            'environment=staging',
        ]);
        const rendered = docs(manifest);
        const serviceMonitors = rendered.filter((doc) => doc.kind === 'ServiceMonitor');
        expect(serviceMonitors).toHaveLength(1);

        const serviceMonitor = serviceMonitors[0];
        expect(serviceMonitor.metadata.name).toBe('dspace');
        expect(serviceMonitor.metadata.labels.release).toBe('kube-prometheus-stack');
        expect(serviceMonitor.spec.selector.matchLabels).toEqual({
            'app.kubernetes.io/name': 'dspace',
            'app.kubernetes.io/instance': 'dspace',
        });
        expect(serviceMonitor.spec.namespaceSelector.matchNames).toEqual(['dspace']);
        expect(serviceMonitor.spec.endpoints[0]).toMatchObject({
            port: 'http',
            path: '/metrics',
            interval: '30s',
            scrapeTimeout: '10s',
            bearerTokenSecret: {
                name: 'dspace-staging-metrics-token',
                key: 'token',
            },
        });
        expect(serviceMonitor.spec.endpoints[0].relabelings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ targetLabel: 'app', replacement: 'dspace' }),
                expect.objectContaining({
                    targetLabel: 'environment',
                    replacement: 'staging',
                }),
                expect.objectContaining({
                    targetLabel: 'namespace',
                    replacement: 'dspace',
                }),
                expect.objectContaining({
                    targetLabel: 'release',
                    replacement: 'dspace',
                }),
                expect.objectContaining({
                    targetLabel: 'cluster',
                    replacement: 'sugarkube',
                }),
            ])
        );
    });

    it('injects metrics runtime env from chart values without rendering a token value', () => {
        const manifest = render([
            '--set',
            'metrics.enabled=true',
            '--set',
            'metrics.auth.existingSecret=dspace-staging-metrics-token',
            '--set',
            'serviceMonitor.enabled=true',
        ]);
        const deployment = docs(manifest).find((doc) => doc.kind === 'Deployment');
        const env = deployment.spec.template.spec.containers[0].env;
        expect(env).toContainEqual({ name: 'METRICS_ENABLED', value: 'true' });
        expect(env).toContainEqual({
            name: 'METRICS_TOKEN',
            valueFrom: {
                secretKeyRef: {
                    name: 'dspace-staging-metrics-token',
                    key: 'token',
                },
            },
        });
        expect(manifest).not.toMatch(/super-secret|actual-token|bearer-value/i);
    });

    it('renders a ServiceMonitor when targetLabels are explicitly null', () => {
        const manifest = render([
            '--set',
            'metrics.enabled=true',
            '--set',
            'metrics.auth.existingSecret=dspace-staging-metrics-token',
            '--set',
            'serviceMonitor.enabled=true',
            '--set-json',
            'serviceMonitor.targetLabels=null',
        ]);
        const serviceMonitor = docs(manifest).find((doc) => doc.kind === 'ServiceMonitor');
        expect(serviceMonitor.spec).not.toHaveProperty('targetLabels');
    });

    it('fails rendering when metrics are enabled without an authentication Secret', () => {
        expect(() => render(['--set', 'metrics.enabled=true'])).toThrow(
            /metrics\.enabled=true requires metrics\.auth\.existingSecret/
        );
    });

    it('allows public ingress without metrics auth while disabling the runtime metrics endpoint', () => {
        const manifest = render([
            '--set',
            'ingress.enabled=true',
            '--set',
            'ingress.host=dspace.example.test',
        ]);
        const rendered = docs(manifest);
        expect(rendered.filter((doc) => doc.kind === 'Ingress')).toHaveLength(1);
        const deployment = rendered.find((doc) => doc.kind === 'Deployment');
        const env = deployment.spec.template.spec.containers[0].env;
        expect(env).toContainEqual({ name: 'METRICS_ENABLED', value: 'false' });
        expect(env).not.toContainEqual(expect.objectContaining({ name: 'METRICS_TOKEN' }));
    });

    it('does not create a public metrics ingress or monitoring UI ingress', () => {
        const manifest = render([
            '--set',
            'ingress.enabled=true',
            '--set',
            'ingress.host=dspace.example.test',
            '--set',
            'metrics.enabled=true',
            '--set',
            'metrics.auth.existingSecret=dspace-staging-metrics-token',
            '--set',
            'serviceMonitor.enabled=true',
        ]);
        const ingresses = docs(manifest).filter((doc) => doc.kind === 'Ingress');
        expect(ingresses).toHaveLength(1);
        expect(ingresses[0].metadata.name).toBe('dspace');
        const ingressYaml = YAML.stringify(ingresses[0]);
        expect(ingressYaml).not.toContain('prometheus');
        expect(ingressYaml).not.toContain('grafana');
        expect(ingressYaml).not.toMatch(/path:\s+\/metrics/);
    });
});
