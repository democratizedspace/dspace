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
    'More → Processes opens /processes.',
    'More → Import/export gamesaves opens /gamesaves.',
    'More → Cloud Sync opens /cloudsync.',
    'More → Custom Content Backup opens /contentbackup.',
    'More → Guilds is marked Coming soon (no navigation yet).',
    'More → Stats opens /stats.',
    'More → Achievements opens /achievements.',
    'More → Leaderboard opens /leaderboard.',
    'More → Locations is marked Coming soon (no navigation yet).',
    'More → Titles opens /titles.',
    'More → Toolbox opens /toolbox.',
    'More → Settings opens /settings.',
    'More → Discord opens https://discord.gg/A3UAfYvnxM.',
    'More → Twitter opens https://twitter.com/dspacegame.',
    'More → Github opens https://github.com/democratizedspace/dspace.',
    'Quests page → Manage button opens /quests/manage.',
    'Quests manage page → Create button opens /quests/create.',
    'Inventory page → Manage button opens /inventory/manage.',
    'Inventory manage page → Create button opens /inventory/create.',
    'Processes page → Manage button opens /processes/manage.',
    'Processes manage page → Create button opens /processes/create.',
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

    it('lists canonical click-path navigation strings', () => {
        const routeDocs = [ROUTES_DOC_PATH, ROOT_ROUTES_DOC_PATH].map((docPath) => ({
            content: readFileSync(docPath, 'utf8'),
        }));

        for (const { content } of routeDocs) {
            const missing = REQUIRED_CLICK_PATHS.filter((snippet) => !content.includes(snippet));
            expect(missing).toEqual([]);
        }
    });
});
