import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('dspace helm chart probes', () => {
    const testPodPath = join(
        repoRoot,
        'deploy',
        'charts',
        'dspace',
        'templates',
        'tests',
        'test-connection.yaml',
    );
    const manifest = readFileSync(testPodPath, 'utf8');

    it('checks both readiness and liveness endpoints during helm test', () => {
        expect(manifest).toContain('for path in healthz livez; do');
        expect(manifest).toMatch(/curl[^\n]*\$\{path}/);
        expect(manifest).toMatch(/test "\$code" -eq 200/);
    });
});
