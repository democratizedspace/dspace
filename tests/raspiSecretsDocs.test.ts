import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const legacyPaths = [
    join(repoRoot, 'docs', 'ops', 'deploy', 'ras' + 'pi.md'),
    join(repoRoot, 'docs', 'ops', 'RPI_' + 'DEPLOYMENT_GUIDE.md'),
    join(repoRoot, '.github', 'workflows', 'deploy-to-' + 'raspi.yml'),
    join(repoRoot, '.github', 'workflows', 'rpi-' + 'deploy.yml'),
];
const activeDocs = [
    'README.md',
    'docs/ops/README.md',
    'docs/ops/cloudflare_load_balancing.md',
    'docs/ops/failover_procedures.md',
    'docs/ops/netlify-migration.md',
    'frontend/src/pages/docs/md/self-hosting.md',
];

describe('legacy Raspberry Pi deployment cleanup', () => {
    it('removes obsolete direct Raspberry Pi deployment paths', () => {
        for (const legacyPath of legacyPaths) {
            expect(existsSync(legacyPath), legacyPath).toBe(false);
        }
    });

    it('keeps active docs pointed at the Sugarkube deployment model', () => {
        const stalePattern = new RegExp(
            [
                'deploy-to-' + 'raspi',
                'rpi-' + 'deploy',
                'RPI_' + 'HOST',
                'RPI_' + 'USER',
                'RPI_' + 'SSH_KEY',
                'Raspberry Pi Deployment ' + 'Guide',
                'Raspberry Pi k3s ' + 'Deployment',
                'docs/ops/deploy/ras' + 'pi\\.md',
                'docs/ops/RPI_' + 'DEPLOYMENT_GUIDE\\.md',
            ].join('|')
        );

        for (const relativePath of activeDocs) {
            const content = readFileSync(join(repoRoot, relativePath), 'utf8');
            expect(content, relativePath).not.toMatch(stalePattern);
        }

        const releaseRunbook = readFileSync(
            join(repoRoot, 'docs', 'ops', 'sugarkube-release.md'),
            'utf8'
        );
        expect(releaseRunbook).toMatch(/\.github\/workflows\/ci-image\.yml/);
        expect(releaseRunbook).toMatch(/\.github\/workflows\/ci-helm\.yml/);
    });
});
