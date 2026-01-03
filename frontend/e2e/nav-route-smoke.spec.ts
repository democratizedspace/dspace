import { test, expect } from '@playwright/test';
import menu from '../src/config/menu.json' assert { type: 'json' };
import { clearUserData, waitForHydration } from './test-helpers';

const pinnedRoutes = menu
    .filter(
        (item) =>
            item.pinned &&
            !item.comingSoon &&
            typeof item.href === 'string' &&
            item.href.startsWith('/')
    )
    .map((item) => item.href);

const toolboxAndEditors = [
    '/toolbox',
    '/gamesaves',
    '/inventory/manage',
    '/processes/manage',
    '/quests/manage',
];

const routes = Array.from(new Set([...pinnedRoutes, ...toolboxAndEditors]));

test.describe('Navigation smoke', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const route of routes) {
        test(`loads ${route} without console errors`, async ({ page }) => {
            const consoleErrors: string[] = [];

            page.on('console', (message) => {
                if (message.type() === 'error') {
                    consoleErrors.push(message.text());
                }
            });

            page.on('pageerror', (error) => {
                consoleErrors.push(error.message);
            });

            const response = await page.goto(route);
            expect(response?.ok(), `Expected ${route} to load successfully`).toBeTruthy();

            await waitForHydration(page);

            const main = page.locator('main');
            await expect(main, `${route} should render main content`).toBeVisible();

            const heading = main.getByRole('heading').first();
            if ((await heading.count()) > 0) {
                await expect(heading).toBeVisible();
                await expect(heading).not.toHaveText(/^\s*$/);
            } else {
                await expect(main).not.toHaveText(/^\s*$/);
            }

            expect(consoleErrors, `${route} should not log console errors`).toEqual([]);
        });
    }
});
