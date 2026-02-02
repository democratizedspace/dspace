import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROUTES_DOC_PATH = path.join(
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
    '/quests/manage',
    '/quests/create',
    '/inventory/manage',
    '/inventory/create',
    '/processes/manage',
    '/processes/create',
    '/contentbackup',
    '/gamesaves',
    '/toolbox',
    '/wallet',
];
const REQUIRED_DYNAMIC_ROUTES = [
    '/quests/:id',
    '/quests/:id/edit',
    '/inventory/item/:itemId',
    '/inventory/item/:itemId/edit',
    '/processes/:processId',
    '/processes/:processId/edit',
];
const REQUIRED_CLICK_PATHS = [
    'More → Import/export gamesaves opens /gamesaves.',
    'More → Custom Content Backup opens /contentbackup.',
    'More → Toolbox opens /toolbox.',
    'Quests page → Manage button → /quests/manage.',
    'Quests page → Manage button → Manage page Create button → /quests/create.',
    'Inventory page → Manage button → /inventory/manage.',
    'Inventory page → Manage button → Manage page Create button → /inventory/create.',
    'Processes page → Manage button → /processes/manage.',
    'Processes page → Manage button → Manage page Create button → /processes/create.',
];

describe('routes docs coverage', () => {
    it('includes canonical routes needed for custom content UX', () => {
        const routeDocs = [ROUTES_DOC_PATH, ROOT_ROUTES_DOC_PATH].map((docPath) => ({
            content: readFileSync(docPath, 'utf8'),
        }));

        for (const { content } of routeDocs) {
            const missing = REQUIRED_ROUTES.filter((route) => !content.includes(route));
            expect(missing).toEqual([]);
        }
    });

    it('keeps route patterns consistent in both route catalogs', () => {
        const routeDocs = [ROUTES_DOC_PATH, ROOT_ROUTES_DOC_PATH].map((docPath) => ({
            content: readFileSync(docPath, 'utf8'),
        }));

        for (const { content } of routeDocs) {
            const missing = REQUIRED_DYNAMIC_ROUTES.filter((route) => !content.includes(route));
            expect(missing).toEqual([]);
            expect(content).not.toMatch(/\/\[[^\]]+\]/);
        }
    });

    it('includes canonical click-paths for menu navigation and editor entrypoints', () => {
        const routeDocs = [ROUTES_DOC_PATH, ROOT_ROUTES_DOC_PATH].map((docPath) => ({
            content: readFileSync(docPath, 'utf8'),
        }));

        for (const { content } of routeDocs) {
            const missing = REQUIRED_CLICK_PATHS.filter((entry) => !content.includes(entry));
            expect(missing).toEqual([]);
        }
    });
});
