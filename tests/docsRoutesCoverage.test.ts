import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROUTE_DOC_PATHS = [
    path.join(process.cwd(), 'docs', 'ROUTES.md'),
    path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md', 'routes.md'),
];

const REQUIRED_ROUTES = [
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
    '/contentbackup',
    '/gamesaves',
    '/toolbox',
];

const REQUIRED_PARAM_ROUTES = [
    '/docs/:slug',
    '/docs/changelog/:slug',
    '/quests/:pathId/:questId',
    '/quests/:pathId/:questId/edit',
    '/quests/:pathId/:questId/finished',
    '/shop/buy/:itemId',
    '/shop/buy/:itemId/:count',
    '/shop/sell/:itemId',
    '/shop/sell/:itemId/:count',
    '/import/:newVersion/:oldVersion',
    '/import/:newVersion/:oldVersion/done',
];

const BRACKETED_ROUTE_PATTERN = /\/\[[^\]]+\]/;

describe('routes docs coverage', () => {
    it('includes canonical routes needed for navigation and custom content UX', () => {
        for (const docPath of ROUTE_DOC_PATHS) {
            const content = readFileSync(docPath, 'utf8');
            const missing = REQUIRED_ROUTES.filter((route) => !content.includes(route));

            expect(missing).toEqual([]);
        }
    });

    it('documents parameterized routes using :param notation', () => {
        for (const docPath of ROUTE_DOC_PATHS) {
            const content = readFileSync(docPath, 'utf8');
            const missing = REQUIRED_PARAM_ROUTES.filter((route) => !content.includes(route));

            expect(missing).toEqual([]);
            expect(content).not.toMatch(BRACKETED_ROUTE_PATTERN);
        }
    });
});
