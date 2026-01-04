import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const TOP_NAV_ROUTES = [
    '/',
    '/quests',
    '/inventory',
    '/energy',
    '/wallet',
    '/profile',
    '/docs',
    '/chat',
    '/changelog',
];

const MORE_MENU_ROUTES = [
    '/settings',
    '/cloudsync',
    '/stats',
    '/leaderboard',
    '/gamesaves',
    '/contentbackup',
    '/achievements',
    '/titles',
    '/shop',
];

const TOOLBOX_AND_EDITORS = [
    '/toolbox',
    '/inventory/manage',
    '/processes/manage',
    '/quests/manage',
    '/inventory/create',
    '/processes/create',
    '/quests/create',
];

test.describe('Nav route smoke', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('visits nav routes without console errors', async ({ page }) => {
        const consoleErrors: Array<{ route: string; message: string }> = [];
        let activeRoute = '';

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push({ route: activeRoute || page.url(), message: msg.text() });
            }
        });

        page.on('pageerror', (error) => {
            consoleErrors.push({ route: activeRoute || page.url(), message: error.message });
        });

        const visitAndAssert = async (route: string) => {
            activeRoute = route;
            const response = await page.goto(route);
            expect(response?.status()).toBeLessThan(400);

            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const heading = page.locator('main h1, main h2, main [role="heading"]');
            await expect(heading.first()).toBeVisible();
            const text = (await heading.first().textContent()) ?? '';
            expect(text.trim().length).toBeGreaterThan(0);
        };

        for (const route of TOP_NAV_ROUTES) {
            await visitAndAssert(route);
        }

        for (const route of MORE_MENU_ROUTES) {
            await visitAndAssert(route);
        }

        for (const route of TOOLBOX_AND_EDITORS) {
            await visitAndAssert(route);
        }

        activeRoute = '/non-existent-page-e2e';
        const missingResponse = await page.goto(activeRoute);
        expect(missingResponse?.status()).toBe(404);
        const notFoundHeading = page.locator('h2:has-text("404"), h1:has-text("404")');
        await expect(notFoundHeading.first()).toBeVisible();

        expect(consoleErrors).toEqual([]);
    });
});
