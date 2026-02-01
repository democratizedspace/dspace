import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('docs routes coverage', () => {
    const routesPath = path.join(
        process.cwd(),
        'frontend',
        'src',
        'pages',
        'docs',
        'md',
        'routes.md'
    );

    it('includes canonical content management routes in /docs/routes', () => {
        const content = readFileSync(routesPath, 'utf8');
        const requiredRoutes = [
            '/quests/manage',
            '/quests/create',
            '/inventory/manage',
            '/inventory/create',
            '/processes/manage',
            '/processes/create',
            '/contentbackup',
            '/gamesaves',
        ];

        const missingRoutes = requiredRoutes.filter((route) => !content.includes(route));
        expect(missingRoutes).toEqual([]);
    });
});
