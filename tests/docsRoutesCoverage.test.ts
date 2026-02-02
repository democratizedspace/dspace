import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROUTES_DOC_PATHS = [
    path.join(process.cwd(), 'docs', 'ROUTES.md'),
    path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md', 'routes.md'),
];

const REQUIRED_ROUTES = [
    '/',
    '/quests',
    '/inventory',
    '/energy',
    '/wallet',
    '/profile',
    '/docs',
    '/chat',
    '/changelog',
    '/processes',
    '/gamesaves',
    '/contentbackup',
    '/cloudsync',
    '/stats',
    '/achievements',
    '/leaderboard',
    '/titles',
    '/toolbox',
    '/settings',
    '/quests/manage',
    '/quests/create',
    '/quests/:id',
    '/quests/:id/edit',
    '/inventory/manage',
    '/inventory/create',
    '/inventory/item/:itemId',
    '/inventory/item/:itemId/edit',
    '/processes/manage',
    '/processes/create',
    '/processes/:processId',
    '/processes/:processId/edit',
];

const REQUIRED_PARAM_ROUTES = ['/quests/:id', '/inventory/item/:itemId', '/processes/:processId'];

const DISALLOWED_PATTERNS = ['[id]'];

describe('routes docs coverage', () => {
    it('includes canonical routes needed for custom content UX', () => {
        const missing = [];

        for (const docPath of ROUTES_DOC_PATHS) {
            const content = readFileSync(docPath, 'utf8');
            const missingRoutes = REQUIRED_ROUTES.filter((route) => !content.includes(route));
            missing.push(...missingRoutes.map((route) => `${route} (${path.basename(docPath)})`));
        }

        expect(missing).toEqual([]);
    });

    it('uses colon-style parameters in the route catalog', () => {
        const failures = [];

        for (const docPath of ROUTES_DOC_PATHS) {
            const content = readFileSync(docPath, 'utf8');

            const missingParams = REQUIRED_PARAM_ROUTES.filter((route) => !content.includes(route));
            failures.push(...missingParams.map((route) => `${route} (${path.basename(docPath)})`));

            const disallowed = DISALLOWED_PATTERNS.filter((pattern) => content.includes(pattern));
            failures.push(...disallowed.map((pattern) => `${pattern} (${path.basename(docPath)})`));
        }

        expect(failures).toEqual([]);
    });
});
