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

describe('routes docs coverage', () => {
    it('includes canonical routes needed for custom content UX', () => {
        const content = readFileSync(ROUTES_DOC_PATH, 'utf8');
        const missing = REQUIRED_ROUTES.filter((route) => !content.includes(route));

        expect(missing).toEqual([]);
    });
});
