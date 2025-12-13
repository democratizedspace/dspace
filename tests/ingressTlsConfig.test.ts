import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const chartValuesPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.yaml');
const chartValues = readFileSync(chartValuesPath, 'utf8');

const environments = ['dev', 'int', 'prod'] as const;

const overlayValues = environments.map((env) => ({
    env,
    content: readFileSync(join(repoRoot, 'deploy', 'env', env, 'values.yaml'), 'utf8'),
}));

describe('dspace ingress TLS configuration', () => {
    it('requests a cert-manager certificate by default', () => {
        expect(chartValues).toContain('cert-manager.io/cluster-issuer: letsencrypt-dns01');
    });

    it('defaults to the traefik ingress class', () => {
        expect(chartValues).toContain('className: traefik');
    });

    overlayValues.forEach(({ env, content }) => {
        it(`${env} overlay pins the TLS secret to its hostname`, () => {
            const hostMatch = content.match(/- host:\s*([^\s]+)\s*\n\s*paths:/);
            expect(hostMatch).not.toBeNull();
            const host = hostMatch?.[1];

            const tlsMatch = content.match(
                /tls:\s*\n\s*- secretName:\s*([^\s]+)\s*\n\s*hosts:\s*\n\s*- ([^\s]+)/,
            );
            expect(tlsMatch).not.toBeNull();

            const [, secretName, tlsHost] = tlsMatch ?? [];
            expect(tlsHost).toBe(host);
            expect(secretName).toBe(`dspace-${env}-tls`);
        });

        it(`${env} overlay keeps the cert-manager cluster issuer annotation`, () => {
            expect(content).toContain('cert-manager.io/cluster-issuer: letsencrypt-dns01');
        });

        it(`${env} overlay declares the traefik ingress class`, () => {
            expect(content).toContain('className: traefik');
        });
    });
});
