import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type TlsEntry = {
    secretName: string;
    hosts: string[];
};

type IngressTlsInfo = {
    hosts: string[];
    tlsEntries: TlsEntry[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function extractIngressTlsInfo(yamlContent: string): IngressTlsInfo {
    const lines = yamlContent.split('\n');
    const hosts: string[] = [];
    const tlsEntries: TlsEntry[] = [];

    let inIngress = false;
    let ingressIndent = Number.POSITIVE_INFINITY;
    let readingIngressHosts = false;
    let ingressHostsIndent = Number.POSITIVE_INFINITY;

    let inTls = false;
    let tlsIndent = Number.POSITIVE_INFINITY;
    let currentTls: TlsEntry | null = null;
    let readingTlsHosts = false;
    let tlsHostsIndent = Number.POSITIVE_INFINITY;

    for (const rawLine of lines) {
        const indentMatch = rawLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        const line = rawLine.trim();

        if (!line || line.startsWith('#')) {
            continue;
        }

        if (!inIngress) {
            if (line.startsWith('ingress:')) {
                inIngress = true;
                ingressIndent = indent;
            }
            continue;
        }

        if (indent <= ingressIndent && !line.startsWith('-')) {
            inIngress = false;
            readingIngressHosts = false;
            inTls = false;
            currentTls = null;
            readingTlsHosts = false;
            continue;
        }

        if (!inTls && line.startsWith('hosts:') && indent === ingressIndent + 2) {
            readingIngressHosts = true;
            ingressHostsIndent = indent;
            continue;
        }

        if (readingIngressHosts) {
            if (indent <= ingressHostsIndent) {
                readingIngressHosts = false;
            } else if (line.startsWith('- host:')) {
                hosts.push(line.replace('- host:', '').trim());
                continue;
            }
        }

        if (line.startsWith('tls:') && indent === ingressIndent + 2) {
            inTls = true;
            tlsIndent = indent;
            currentTls = null;
            readingTlsHosts = false;
            continue;
        }

        if (inTls) {
            if (indent <= tlsIndent && !line.startsWith('-')) {
                inTls = false;
                currentTls = null;
                readingTlsHosts = false;
                continue;
            }

            if (line.startsWith('- ') && indent === tlsIndent + 2) {
                currentTls = { secretName: '', hosts: [] };
                const remainder = line.slice(2).trim();
                if (remainder.startsWith('secretName:')) {
                    currentTls.secretName = remainder.replace('secretName:', '').trim();
                }
                tlsEntries.push(currentTls);
                readingTlsHosts = false;
                continue;
            }

            if (!currentTls) {
                continue;
            }

            if (line.startsWith('secretName:')) {
                currentTls.secretName = line.replace('secretName:', '').trim();
                continue;
            }

            if (line.startsWith('hosts:')) {
                readingTlsHosts = true;
                tlsHostsIndent = indent;
                continue;
            }

            if (readingTlsHosts) {
                if (indent <= tlsHostsIndent) {
                    readingTlsHosts = false;
                } else if (line.startsWith('- ')) {
                    currentTls.hosts.push(line.slice(2).trim());
                    continue;
                }
            }
        }
    }

    return { hosts, tlsEntries };
}

describe('dspace helm chart TLS configuration', () => {
    const chartValuesPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.yaml');
    const chartValues = readFileSync(chartValuesPath, 'utf8');
    const tlsDocPath = join(repoRoot, 'docs', 'prompts', 'codex', 'dspace-v3-k3s.md');
    const tlsDoc = readFileSync(tlsDocPath, 'utf8');

    it('documents TLS completion in the deployment prompt', () => {
        expect(tlsDoc).toMatch(/- \[x\] TLS via cert-manager works/);
    });

    it('enables cert-manager TLS annotations and host coverage in the base chart', () => {
        expect(chartValues).toMatch(/cert-manager\.io\/cluster-issuer:\s+letsencrypt-dns01/);
        const { hosts, tlsEntries } = extractIngressTlsInfo(chartValues);

        expect(hosts.length).toBeGreaterThan(0);
        expect(tlsEntries.length).toBeGreaterThan(0);

        const tlsHosts = tlsEntries.flatMap((entry) => entry.hosts);
        for (const host of hosts) {
            expect(tlsHosts).toContain(host);
        }
        for (const entry of tlsEntries) {
            expect(entry.secretName).toMatch(/\S/);
        }
    });

    for (const env of ['dev', 'int', 'prod']) {
        it(`configures TLS secrets for ingress hosts in ${env} values`, () => {
            const valuesPath = join(repoRoot, 'deploy', 'env', env, 'values.yaml');
            const valuesContent = readFileSync(valuesPath, 'utf8');
            const { hosts, tlsEntries } = extractIngressTlsInfo(valuesContent);

            expect(hosts.length).toBeGreaterThan(0);
            expect(tlsEntries.length).toBeGreaterThan(0);

            const tlsHosts = new Set(tlsEntries.flatMap((entry) => entry.hosts));
            for (const host of hosts) {
                expect(tlsHosts.has(host)).toBe(true);
            }
            for (const entry of tlsEntries) {
                expect(entry.secretName).toMatch(/^dspace-/);
            }
        });
    }
});
