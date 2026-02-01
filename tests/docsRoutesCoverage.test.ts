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

const REQUIRED_ROUTES = [
    '/quests/manage',
    '/quests/create',
    '/inventory/manage',
    '/inventory/create',
    '/processes/manage',
    '/processes/create',
    '/contentbackup',
    '/gamesaves',
];

describe('Docs routes coverage', () => {
    it('lists canonical management and backup routes', () => {
        const content = readFileSync(ROUTES_DOC_PATH, 'utf8');

        REQUIRED_ROUTES.forEach((route) => {
            expect(content).toContain(route);
        });
    });
});
