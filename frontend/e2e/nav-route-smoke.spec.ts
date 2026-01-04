import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const ROUTES = [
    '/',
    '/quests',
    '/inventory',
    '/energy',
    '/wallet',
    '/docs',
    '/chat',
    '/toolbox',
    '/processes',
    '/quests/manage',
    '/inventory/manage',
    '/processes/manage',
];

test.describe('Nav route smoke', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads top nav and toolbox routes without console errors', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', (message) => {
            if (message.type() !== 'error') {
                return;
            }

            const text = message.text();
            if (text.includes('ResizeObserver loop limit exceeded')) {
                return;
            }

            consoleErrors.push(text);
        });

        for (const route of ROUTES) {
            const response = await page.goto(route, { waitUntil: 'networkidle' });
            expect(response?.ok(), `${route} should respond with ok status`).toBeTruthy();

            await waitForHydration(page);

            const mainHeading = page.locator('main h1, main h2').first();
            await expect(mainHeading, `${route} should render a visible heading`).toBeVisible();
            await expect(mainHeading).toHaveText(/\S/);
        }

        expect(consoleErrors, `Console errors encountered: ${consoleErrors.join('\n')}`).toEqual([]);
    });
});
