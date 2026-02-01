import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Docs routes catalog', () => {
    it('includes key nav and custom content routes', () => {
        const routesPath = path.join(process.cwd(), 'docs', 'ROUTES.md');
        const content = readFileSync(routesPath, 'utf8');
        const requiredRoutes = [
            '/contentbackup',
            '/gamesaves',
            '/quests/manage',
            '/processes/manage',
        ];

        requiredRoutes.forEach((route) => {
            expect(content).toContain(route);
        });
    });
});
