import { expect, test } from '@playwright/test';
import {
    clearUserData,
    expectLocalStorageValue,
    navigateWithRetry,
    waitForHydration,
} from './test-helpers';

const VIEWPORTS = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'mobile', width: 430, height: 860 },
];

const THEME_KEY = 'dspace-theme';

const assertCentered = (mainCenter: number, brandCenter: number) => {
    expect(Math.abs(brandCenter - mainCenter)).toBeLessThanOrEqual(12);
};

test.describe('v3 regression coverage', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of VIEWPORTS) {
        test(`header centers brand and isolates toggle on ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await navigateWithRetry(page, '/');
            await waitForHydration(page);

            const main = page.locator('main');
            const brand = page.getByTestId('brand-stack');
            const toggle = page.getByTestId('theme-toggle');

            await expect(brand).toBeVisible();
            await expect(toggle).toBeVisible();

            const mainBox = await main.boundingBox();
            const brandBox = await brand.boundingBox();
            const toggleBox = await toggle.boundingBox();

            expect(mainBox).not.toBeNull();
            expect(brandBox).not.toBeNull();
            expect(toggleBox).not.toBeNull();

            const mainCenter = (mainBox?.x ?? 0) + (mainBox?.width ?? 0) / 2;
            const brandCenter = (brandBox?.x ?? 0) + (brandBox?.width ?? 0) / 2;
            assertCentered(mainCenter, brandCenter);

            const toggleCenter = (toggleBox?.x ?? 0) + (toggleBox?.width ?? 0) / 2;
            expect(toggleCenter).toBeGreaterThanOrEqual(mainCenter);

            const overlapsHorizontally =
                (brandBox?.x ?? 0) < (toggleBox?.x ?? 0) + (toggleBox?.width ?? 0) &&
                (toggleBox?.x ?? 0) < (brandBox?.x ?? 0) + (brandBox?.width ?? 0);
            expect(overlapsHorizontally).toBeFalsy();
        });
    }

    test('wallet page restores balances and actions', async ({ page }) => {
        await navigateWithRetry(page, '/wallet');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { name: 'Wallet' })).toBeVisible();
        await expect(page.getByTestId('wallet-balance-card')).toHaveCount(4);
        await expect(page.getByTestId('wallet-process-card')).toContainText(/basic income/i);
        await expect(page.getByTestId('wallet-process-card')).not.toContainText(/coming soon/i);
    });

    test('theme persists across navigation', async ({ page }) => {
        await navigateWithRetry(page, '/');
        await waitForHydration(page);

        const html = page.locator('html');
        const body = page.locator('body');
        const toggle = () => page.getByTestId('theme-toggle');

        const initialTheme = (await html.getAttribute('data-theme')) ?? 'dark';

        await toggle().click();
        const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark';

        const assertTheme = async () => {
            await expect(html).toHaveAttribute('data-theme', expectedTheme);
            await expect(body).toHaveAttribute('data-theme', expectedTheme);
            await expect(toggle()).toContainText(
                expectedTheme === 'dark' ? /Dark mode/i : /Light mode/i
            );
        };

        await assertTheme();
        await expectLocalStorageValue(page, THEME_KEY, expectedTheme);

        const routes = ['/quests', '/wallet', '/profile', '/leaderboard'];
        for (const route of routes) {
            await navigateWithRetry(page, route);
            await waitForHydration(page);
            await assertTheme();
        }
    });

    test('Flywheel navigation entry is removed', async ({ page }) => {
        await navigateWithRetry(page, '/');
        await waitForHydration(page);
        await expect(page.getByRole('link', { name: /flywheel/i })).toHaveCount(0);
    });
});
