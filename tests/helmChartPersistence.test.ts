import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('dspace helm chart persistence', () => {
    const pvcTemplatePath = join(
        repoRoot,
        'deploy',
        'charts',
        'dspace',
        'templates',
        'pvc.yaml',
    );
    const valuesPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.yaml');
    const pvcTemplate = readFileSync(pvcTemplatePath, 'utf8');
    const valuesTemplate = readFileSync(valuesPath, 'utf8');

    it('quotes the configured storage class in the PVC manifest', () => {
        expect(pvcTemplate).toContain(
            '  storageClassName: {{ .Values.persistence.storageClass | quote }}',
        );
    });

    it('defaults persistence storage to the Longhorn class for k3s clusters', () => {
        expect(valuesTemplate).toMatch(/storageClass:\s*longhorn/);
    });
});
