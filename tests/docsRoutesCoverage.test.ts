import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FRONTEND_ROUTES_DOC_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'routes.md'
);

const ROOT_ROUTES_DOC_PATH = path.join(process.cwd(), 'docs', 'ROUTES.md');

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
    '/inventory/item/:itemId/edit',
    '/processes/manage',
    '/processes/create',
    '/processes/:processId/edit',
];

const REQUIRED_PARAM_ROUTES = [
    '/docs/:slug',
    '/inventory/item/:itemId',
    '/processes/:processId',
    '/quests/:id',
    '/quests/:pathId/:questId',
];

const FORBIDDEN_PARAM_PLACEHOLDERS = [
    '[id]',
    '[itemId]',
    '[processId]',
    '[pathId]',
    '[questId]',
    '[slug]',
    '[count]',
    '[newVersion]',
    '[oldVersion]',
];

const readDoc = (docPath: string) => readFileSync(docPath, 'utf8');

const assertRoutes = (content: string, docLabel: string) => {
    const missing = REQUIRED_ROUTES.filter((route) => !content.includes(route));
    expect(missing, `${docLabel} is missing required routes`).toEqual([]);

    const missingParams = REQUIRED_PARAM_ROUTES.filter((route) => !content.includes(route));
    expect(missingParams, `${docLabel} is missing required parameter routes`).toEqual([]);

    const forbidden = FORBIDDEN_PARAM_PLACEHOLDERS.filter((placeholder) =>
        content.includes(placeholder)
    );
    expect(forbidden, `${docLabel} contains bracketed placeholders`).toEqual([]);
};

describe('routes docs coverage', () => {
    it('includes canonical routes needed for navigation and custom content UX', () => {
        assertRoutes(readDoc(FRONTEND_ROUTES_DOC_PATH), 'frontend routes doc');
        assertRoutes(readDoc(ROOT_ROUTES_DOC_PATH), 'root routes doc');
    });
});
