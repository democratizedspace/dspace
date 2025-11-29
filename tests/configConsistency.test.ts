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
    const valuesYaml = readFile('charts/dspace/values.yaml');

    it('service.port matches canonical port', () => {
        expect(valuesYaml).toMatch(new RegExp(`service:\\s*\\n\\s*type:\\s*\\w+\\s*\\n\\s*port:\\s*${CANONICAL_PORT}`));
    });

    it('readiness probe uses canonical health endpoint', () => {
        expect(valuesYaml).toMatch(
            new RegExp(`readinessPath:\\s*${CANONICAL_HEALTH_PATH}`)
        );
    });

    it('liveness probe uses canonical liveness endpoint', () => {
        expect(valuesYaml).toMatch(
            new RegExp(`livenessPath:\\s*${CANONICAL_LIVENESS_PATH}`)
        );
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
    const dockerCompose = readFile('docker-compose.yml');

    it('port mapping uses canonical port', () => {
        expect(dockerCompose).toMatch(
            new RegExp(`ports:\\s*\\n\\s*-\\s*['"]?${CANONICAL_PORT}:${CANONICAL_PORT}`)
        );
    });

    it('PORT environment variable is canonical port', () => {
        expect(dockerCompose).toMatch(
            new RegExp(`PORT\\s*=\\s*${CANONICAL_PORT}`)
        );
    });

    it('healthcheck uses canonical health endpoint', () => {
        expect(dockerCompose).toContain(CANONICAL_HEALTH_PATH);
    });
});

describe('config consistency: infra/k8s manifests', () => {
    const deployment = readFile('infra/k8s/dspace-deployment.yaml');
    const service = readFile('infra/k8s/dspace-service.yaml');

    it('deployment container port is canonical', () => {
        expect(deployment).toMatch(
            new RegExp(`containerPort:\\s*${CANONICAL_PORT}`)
        );
    });

    it('deployment PORT env is canonical', () => {
        expect(deployment).toMatch(
            new RegExp(`value:\\s*["']?${CANONICAL_PORT}["']?`)
        );
    });

    it('deployment readiness probe uses canonical health endpoint', () => {
        expect(deployment).toMatch(
            new RegExp(`readinessProbe:[\\s\\S]*path:\\s*${CANONICAL_HEALTH_PATH}`)
        );
    });

    it('deployment liveness probe uses canonical liveness endpoint', () => {
        expect(deployment).toMatch(
            new RegExp(`livenessProbe:[\\s\\S]*path:\\s*${CANONICAL_LIVENESS_PATH}`)
        );
    });

    it('service port is canonical', () => {
        expect(service).toMatch(new RegExp(`port:\\s*${CANONICAL_PORT}`));
    });

    it('service targetPort is canonical', () => {
        expect(service).toMatch(new RegExp(`targetPort:\\s*${CANONICAL_PORT}`));
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
        expect(healthz).toContain('ready');
    });

    it('livez.ts endpoint exists', () => {
        const livez = readFile('frontend/src/pages/livez.ts');
        expect(livez).toContain('status');
        expect(livez).toContain('alive');
    });

    it('/health is an alias for /healthz', () => {
        const health = readFile('frontend/src/pages/health.ts');
        expect(health).toContain('healthz');
    });
});
