import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROUTES_DOC_PATH = path.join(process.cwd(), 'docs', 'ROUTES.md');
const ROUTES_PAGE_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'routes.md'
);
const REQUIRED_ROUTES = ['/contentbackup', '/gamesaves', '/quests/manage', '/processes/manage'];

describe('Routes catalog docs', () => {
    it.each([ROUTES_DOC_PATH, ROUTES_PAGE_PATH])(
        'includes key routes in %s',
        (filePath) => {
            const content = readFileSync(filePath, 'utf8');

            REQUIRED_ROUTES.forEach((route) => {
                expect(content).toContain(route);
            });
        }
    );
});
