import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const overlayEnvironments = ['dev', 'int', 'prod'] as const;

describe('dspace helm chart TLS configuration', () => {
    const valuesPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.yaml');
    const valuesTemplate = readFileSync(valuesPath, 'utf8');

    it('enables cert-manager TLS on the primary ingress by default', () => {
        expect(valuesTemplate).toMatch(
            /cert-manager\.io\/cluster-issuer:\s*letsencrypt-dns01/,
        );
        expect(valuesTemplate).toMatch(/ingress:\s*[\s\S]*className:\s*traefik/);
        expect(valuesTemplate).toMatch(/tls:\s*\n\s*- secretName:\s*dspace-tls/);
        expect(valuesTemplate).toMatch(/tls:[\s\S]*hosts:\s*\n\s*- dspace\.example\.com/);
    });

    for (const env of overlayEnvironments) {
        it(`wires ${env} ingress TLS secrets to the declared host`, () => {
            const overlayPath = join(repoRoot, 'deploy', 'env', env, 'values.yaml');
            const overlay = readFileSync(overlayPath, 'utf8');

            const hostMatch = overlay.match(/hosts:\s*\n\s*-\s*host:\s*([^\n]+)/);
            expect(hostMatch, `ingress host missing in ${env} overlay`).not.toBeNull();
            const host = hostMatch?.[1].trim();

            const tlsMatch = overlay.match(
                /tls:\s*\n\s*-\s*secretName:\s*([^\n]+)\n\s*hosts:\s*\n\s*-\s*([^\n]+)/,
            );
            expect(tlsMatch, `TLS configuration missing in ${env} overlay`).not.toBeNull();
            const [, secretName, tlsHost] = tlsMatch ?? [];

            expect(secretName.trim(), `TLS secret name should include ${env}`).toContain(env);
            expect(tlsHost.trim(), `TLS host should match ingress host for ${env}`).toBe(host);
        });
    }
});
