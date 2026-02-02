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
    '/processes/:id',
    '/processes/:id/edit',
];

describe('routes docs coverage', () => {
    it('includes canonical routes needed for custom content UX', () => {
        const content = readFileSync(ROUTES_DOC_PATH, 'utf8');
        const missing = REQUIRED_ROUTES.filter((route) => !content.includes(route));

        expect(missing).toEqual([]);
    });

    it('keeps route patterns consistent in both route catalogs', () => {
        const routeDocs = [ROUTES_DOC_PATH, ROOT_ROUTES_DOC_PATH].map((docPath) => ({
            path: docPath,
            content: readFileSync(docPath, 'utf8'),
        }));

        for (const { content, path: docPath } of routeDocs) {
            const missing = REQUIRED_DYNAMIC_ROUTES.filter((route) => !content.includes(route));
            expect(missing).toEqual([]);
            expect(content).not.toContain('[id]');
            expect(content).not.toContain('[questId]');
            expect(content).not.toContain('[pathId]');
            expect(content).not.toContain('[itemId]');
            expect(content).not.toContain('[processId]');
        }
    });
});
