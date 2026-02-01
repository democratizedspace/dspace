import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const ROUTES_DOC = join(repoRoot, 'frontend/src/pages/docs/md/routes.md');

const REQUIRED_PATHS = [
    '/quests/manage',
    '/quests/create',
    '/inventory/manage',
    '/inventory/create',
    '/processes/manage',
    '/processes/create',
    '/contentbackup',
    '/gamesaves',
];

describe('routes docs coverage', () => {
    it('includes canonical management and backup routes', () => {
        const content = readFileSync(ROUTES_DOC, 'utf-8');

        for (const route of REQUIRED_PATHS) {
            expect(content).toContain(route);
        }
    });
});
