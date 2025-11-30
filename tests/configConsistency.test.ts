/**
 * Config Consistency Tests
 *
 * Ensures that the Dockerfile, Helm chart, docker-compose, k8s manifests, and docs
 * agree on the canonical port and health endpoints for the DSPACE application.
 *
 * Canonical configuration:
 * - Port: 8080
 * - Health endpoints: /healthz (readiness), /livez (liveness)
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

// Canonical values that all configurations should agree on
const CANONICAL_PORT = 8080;
const CANONICAL_HEALTH_PATH = '/healthz';
const CANONICAL_LIVENESS_PATH = '/livez';

function readFile(relativePath: string): string {
    const fullPath = join(repoRoot, relativePath);
    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    return readFileSync(fullPath, 'utf8');
}

function parseYamlFile<T = unknown>(relativePath: string): T {
    return parseYaml(readFile(relativePath)) as T;
}

/**
 * Minimal interfaces for testing purposes only.
 * These interfaces only include fields that are being validated by the tests.
 * Additional fields in the YAML files are allowed but not type-checked.
 */
interface HelmValues {
    service: {
        port: number;
        [key: string]: unknown;
    };
    probes: {
        readinessPath: string;
        livenessPath: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface DockerComposeConfig {
    services: {
        app: {
            ports: string[];
            environment: string[];
            healthcheck: {
                test: string[];
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface K8sDeployment {
    spec: {
        template: {
            spec: {
                containers: Array<{
                    ports: Array<{ containerPort: number; [key: string]: unknown }>;
                    env: Array<{ name: string; value: string; [key: string]: unknown }>;
                    livenessProbe?: { httpGet: { path: string; port: number; [key: string]: unknown }; [key: string]: unknown };
                    readinessProbe?: { httpGet: { path: string; port: number; [key: string]: unknown }; [key: string]: unknown };
                    [key: string]: unknown;
                }>;
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface K8sService {
    spec: {
        ports: Array<{ port: number; targetPort: number; [key: string]: unknown }>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

describe('config consistency: Dockerfile', () => {
    const dockerfile = readFile('Dockerfile');

    it('sets PORT environment variable to canonical port', () => {
        expect(dockerfile).toMatch(new RegExp(`ENV\\s+PORT\\s*=\\s*${CANONICAL_PORT}`));
    });

    it('exposes the canonical port', () => {
        expect(dockerfile).toMatch(new RegExp(`EXPOSE\\s+${CANONICAL_PORT}`));
    });

    it('healthcheck uses canonical health endpoint', () => {
        expect(dockerfile).toContain(CANONICAL_HEALTH_PATH);
    });

    it('healthcheck uses canonical port', () => {
        expect(dockerfile).toMatch(
            new RegExp(`HEALTHCHECK.*${CANONICAL_PORT}.*${CANONICAL_HEALTH_PATH}`)
        );
    });
});

describe('config consistency: Helm chart (charts/dspace)', () => {
    const values = parseYamlFile<HelmValues>('charts/dspace/values.yaml');

    it('service.port matches canonical port', () => {
        expect(values.service.port).toBe(CANONICAL_PORT);
    });

    it('readiness probe uses canonical health endpoint', () => {
        expect(values.probes.readinessPath).toBe(CANONICAL_HEALTH_PATH);
    });

    it('liveness probe uses canonical liveness endpoint', () => {
        expect(values.probes.livenessPath).toBe(CANONICAL_LIVENESS_PATH);
    });
});

describe('config consistency: Helm deployment template', () => {
    const deploymentYaml = readFile('charts/dspace/templates/deployment.yaml');

    it('container port is derived from values.service.port', () => {
        expect(deploymentYaml).toContain('containerPort: {{ .Values.service.port }}');
    });

    it('PORT env is set from values.service.port', () => {
        expect(deploymentYaml).toContain('value: "{{ .Values.service.port }}"');
    });

    it('probes reference paths from values', () => {
        expect(deploymentYaml).toContain('path: {{ .Values.probes.livenessPath }}');
        expect(deploymentYaml).toContain('path: {{ .Values.probes.readinessPath }}');
    });
});

describe('config consistency: docker-compose.yml', () => {
    const dockerCompose = parseYamlFile<DockerComposeConfig>('docker-compose.yml');
    const appService = dockerCompose.services.app;

    it('port mapping uses canonical port', () => {
        const portMapping = appService.ports.find((p) => p.includes(String(CANONICAL_PORT)));
        expect(portMapping).toBeDefined();
        expect(portMapping).toBe(`${CANONICAL_PORT}:${CANONICAL_PORT}`);
    });

    it('PORT environment variable is canonical port', () => {
        const portEnv = appService.environment.find((e) => e.startsWith('PORT='));
        expect(portEnv).toBe(`PORT=${CANONICAL_PORT}`);
    });

    it('healthcheck uses canonical health endpoint', () => {
        const healthcheckCmd = appService.healthcheck.test.join(' ');
        expect(healthcheckCmd).toContain(CANONICAL_HEALTH_PATH);
    });
});

describe('config consistency: infra/k8s manifests', () => {
    const deployment = parseYamlFile<K8sDeployment>('infra/k8s/dspace-deployment.yaml');
    const service = parseYamlFile<K8sService>('infra/k8s/dspace-service.yaml');
    const container = deployment.spec.template.spec.containers[0];

    it('deployment container port is canonical', () => {
        expect(container.ports[0].containerPort).toBe(CANONICAL_PORT);
    });

    it('deployment PORT env is canonical', () => {
        const portEnv = container.env.find((e) => e.name === 'PORT');
        expect(portEnv?.value).toBe(String(CANONICAL_PORT));
    });

    it('deployment readiness probe uses canonical health endpoint', () => {
        expect(container.readinessProbe?.httpGet.path).toBe(CANONICAL_HEALTH_PATH);
        expect(container.readinessProbe?.httpGet.port).toBe(CANONICAL_PORT);
    });

    it('deployment liveness probe uses canonical liveness endpoint', () => {
        expect(container.livenessProbe?.httpGet.path).toBe(CANONICAL_LIVENESS_PATH);
        expect(container.livenessProbe?.httpGet.port).toBe(CANONICAL_PORT);
    });

    it('service port is canonical', () => {
        expect(service.spec.ports[0].port).toBe(CANONICAL_PORT);
    });

    it('service targetPort is canonical', () => {
        expect(service.spec.ports[0].targetPort).toBe(CANONICAL_PORT);
    });
});

describe('config consistency: documentation', () => {
    const rpiGuide = readFile('docs/ops/RPI_DEPLOYMENT_GUIDE.md');
    const k8sReadme = readFile('infra/k8s/README.md');

    it('RPI deployment guide references canonical port', () => {
        expect(rpiGuide).toContain(String(CANONICAL_PORT));
    });

    it('RPI deployment guide does not reference old dev port 3002 for production', () => {
        // 3002 should not appear as the production/staging port
        expect(rpiGuide).not.toMatch(/localhost:3002/);
        expect(rpiGuide).not.toMatch(/port\s*\*\*3002\*\*/);
    });

    it('k8s README references canonical port', () => {
        expect(k8sReadme).toContain(String(CANONICAL_PORT));
    });

    it('k8s README references canonical health endpoints', () => {
        expect(k8sReadme).toContain(CANONICAL_HEALTH_PATH);
        expect(k8sReadme).toContain(CANONICAL_LIVENESS_PATH);
    });
});

describe('config consistency: health endpoint implementation', () => {
    it('healthz.ts endpoint exists', () => {
        const healthz = readFile('frontend/src/pages/healthz.ts');
        expect(healthz).toContain('status');
        expect(healthz).toContain("status: 'ok'");
    });

    it('livez.ts endpoint exists', () => {
        const livez = readFile('frontend/src/pages/livez.ts');
        expect(livez).toContain('status');
        expect(livez).toMatch(/buildHealthPayload/);
    });

    it('/health is an alias for /healthz', () => {
        const health = readFile('frontend/src/pages/health.ts');
        // Verify actual re-export from healthz.ts, not just string match
        expect(health).toMatch(/export\s*\{\s*GET\s*\}\s*from\s+['"]\.\/healthz(\.ts)?['"]/);
    });
});
