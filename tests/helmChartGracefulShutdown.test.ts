import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('dspace helm chart graceful shutdown', () => {
    const deploymentPath = join(
        repoRoot,
        'deploy',
        'charts',
        'dspace',
        'templates',
        'deployment.yaml',
    );
    const valuesPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.yaml');
    const deploymentTemplate = readFileSync(deploymentPath, 'utf8');
    const valuesTemplate = readFileSync(valuesPath, 'utf8');

    it('exposes a configurable termination grace period in the deployment template', () => {
        expect(deploymentTemplate).toContain(
            'terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds }}',
        );
    });

    it('defaults the termination grace period to 30 seconds', () => {
        expect(valuesTemplate).toMatch(/terminationGracePeriodSeconds:\s*30/);
    });
});
