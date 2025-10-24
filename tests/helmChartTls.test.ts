import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

interface TlsEntry {
    secretName: string;
    hosts: string[];
}

interface IngressInfo {
    hosts: string[];
    tls: TlsEntry[];
}

const ingressInfoCache = new Map<string, IngressInfo>();

function extractIngressInfo(relativePath: string): IngressInfo {
    if (ingressInfoCache.has(relativePath)) {
        return ingressInfoCache.get(relativePath)!;
    }

    const fullPath = join(repoRoot, relativePath);
    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);

    const info: IngressInfo = { hosts: [], tls: [] };

    let inIngress = false;
    let ingressIndent = 0;
    let inHosts = false;
    let inTls = false;
    let currentTls: TlsEntry | null = null;
    let expectingTlsHosts = false;

    const pushCurrentTls = () => {
        if (currentTls) {
            info.tls.push(currentTls);
            currentTls = null;
        }
    };

    for (const line of lines) {
        const indent = line.match(/^\s*/)![0].length;
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        if (!inIngress) {
            if (indent === 0 && trimmed === 'ingress:') {
                inIngress = true;
                ingressIndent = indent;
                inHosts = false;
                inTls = false;
                currentTls = null;
                expectingTlsHosts = false;
            }
            continue;
        }

        // Leaving the ingress block when indentation drops back to or below the parent level.
        if (indent <= ingressIndent && trimmed.endsWith(':')) {
            pushCurrentTls();
            inIngress = false;
            inHosts = false;
            inTls = false;
            expectingTlsHosts = false;
            continue;
        }

        if (indent === ingressIndent + 2) {
            if (trimmed === 'hosts:') {
                inHosts = true;
                inTls = false;
                pushCurrentTls();
                expectingTlsHosts = false;
                continue;
            }
            if (trimmed === 'tls:') {
                inTls = true;
                inHosts = false;
                pushCurrentTls();
                expectingTlsHosts = false;
                continue;
            }
        }

        if (inHosts) {
            if (indent === ingressIndent + 4 && trimmed.startsWith('- host:')) {
                const value = trimmed.replace('- host:', '').trim();
                info.hosts.push(value);
            }
            continue;
        }

        if (inTls) {
            if (indent === ingressIndent + 4 && trimmed.startsWith('- secretName:')) {
                pushCurrentTls();
                currentTls = {
                    secretName: trimmed.replace('- secretName:', '').trim(),
                    hosts: [],
                };
                expectingTlsHosts = false;
                continue;
            }

            if (indent === ingressIndent + 6 && trimmed === 'hosts:') {
                expectingTlsHosts = true;
                continue;
            }

            if (expectingTlsHosts && indent === ingressIndent + 8 && trimmed.startsWith('- ')) {
                currentTls ??= { secretName: '', hosts: [] };
                currentTls.hosts.push(trimmed.replace('- ', '').trim());
                continue;
            }
        }
    }

    pushCurrentTls();

    ingressInfoCache.set(relativePath, info);
    return info;
}

describe('dspace helm chart TLS defaults', () => {
    const baseValuesPath = join('deploy', 'charts', 'dspace', 'values.yaml');
    const baseValues = readFileSync(join(repoRoot, baseValuesPath), 'utf8');
    const ingress = extractIngressInfo(baseValuesPath);

    it('annotates the ingress for cert-manager', () => {
        expect(baseValues).toMatch(/cert-manager\.io\/cluster-issuer:\s+letsencrypt-dns01/);
    });

    it('defines TLS secrets whose hostnames mirror the ingress hosts', () => {
        expect(ingress.hosts.length).toBeGreaterThan(0);
        expect(ingress.tls.length).toBeGreaterThan(0);
        const tlsHosts = new Set(ingress.tls.flatMap((entry) => entry.hosts));
        for (const host of ingress.hosts) {
            expect(tlsHosts.has(host)).toBe(true);
        }
    });
});

describe('environment overlays keep TLS hostnames in sync', () => {
    const environments: Array<{ name: string; path: string }> = [
        { name: 'dev', path: join('deploy', 'env', 'dev', 'values.yaml') },
        { name: 'int', path: join('deploy', 'env', 'int', 'values.yaml') },
        { name: 'prod', path: join('deploy', 'env', 'prod', 'values.yaml') },
    ];

    for (const env of environments) {
        const ingress = extractIngressInfo(env.path);

        it(`keeps TLS hosts aligned with ingress hosts for ${env.name}`, () => {
            expect(ingress.hosts.length).toBeGreaterThan(0);
            expect(ingress.tls.length).toBeGreaterThan(0);
            for (const entry of ingress.tls) {
                expect(entry.hosts).toEqual(ingress.hosts);
                expect(entry.secretName).toContain(env.name);
            }
        });
    }
});

describe('helm values schema requires TLS configuration', () => {
    const schemaPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    it('marks ingress.tls as a required array with secret and host validation', () => {
        const ingress = schema.properties?.ingress;
        expect(ingress).toBeDefined();
        const ingressProps = ingress.properties ?? {};
        expect(ingress.required).toContain('tls');

        const tls = ingressProps.tls;
        expect(tls).toBeDefined();
        expect(tls.type).toBe('array');
        expect(tls.minItems).toBeGreaterThan(0);

        const itemProps = tls.items?.properties ?? {};
        expect(itemProps.secretName).toBeDefined();
        expect(itemProps.secretName.type).toBe('string');
        expect(itemProps.secretName.minLength).toBe(1);

        expect(itemProps.hosts).toBeDefined();
        expect(itemProps.hosts.type).toBe('array');
        expect(itemProps.hosts.minItems).toBeGreaterThan(0);
        const hostPattern =
            itemProps.hosts.items?.pattern ?? itemProps.hosts.items?.properties?.host?.pattern;
        expect(typeof hostPattern).toBe('string');
        expect(hostPattern).toBe(
            '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[A-Za-z]{2,}$',
        );
    });
});
