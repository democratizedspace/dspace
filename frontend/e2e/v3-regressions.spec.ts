import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const viewports = [
    { label: 'desktop', viewport: { width: 1280, height: 720 } },
    { label: 'mobile', viewport: { width: 430, height: 900 } },
];

for (const { label, viewport } of viewports) {
    test.describe(`Header layout (${label})`, () => {
        test.use({ viewport });

        test('keeps the brand centered with toggle on the right', async ({ page }) => {
            await page.goto('/');
            await waitForHydration(page);

            const header = page.locator('header.header');
            const brand = page.locator('[data-testid="brand"]');
            const toggle = page.getByRole('button', { name: /toggle dark mode/i });

            const [headerBox, brandBox, toggleBox] = await Promise.all([
                header.boundingBox(),
                brand.boundingBox(),
                toggle.boundingBox(),
            ]);

            if (!headerBox || !brandBox || !toggleBox) {
                throw new Error('Unable to read header layout');
            }

            const headerCenter = headerBox.x + headerBox.width / 2;
            const brandCenter = brandBox.x + brandBox.width / 2;

            expect(Math.abs(brandCenter - headerCenter)).toBeLessThanOrEqual(16);
            expect(toggleBox.x).toBeGreaterThan(headerCenter - 12);
            expect(toggleBox.y).toBeLessThanOrEqual(headerBox.y + headerBox.height * 0.6);

            const overlaps = !(
                brandBox.x + brandBox.width <= toggleBox.x ||
                toggleBox.x + toggleBox.width <= brandBox.x ||
                brandBox.y + brandBox.height <= toggleBox.y ||
                toggleBox.y + toggleBox.height <= brandBox.y
            );
            expect(overlaps).toBeFalsy();
        });
    });
}

test.describe('Wallet page', () => {
    test('renders balances and process card', async ({ page }) => {
        const response = await page.goto('/wallet');
        expect(response?.status()).toBeLessThan(400);
        await waitForHydration(page);

        await expect(page.getByRole('heading', { name: /wallet/i })).toBeVisible();
        const balanceRows = page.locator('.balance-row');
        await expect(await balanceRows.count()).toBeGreaterThanOrEqual(2);
        await expect(page.locator('.balance-value')).toContainText(/dUSD/);
        await expect(page.locator('.balance-value')).toContainText(/dBI/);

        const processCard = page.getByRole('heading', { name: /launch basic income/i });
        await expect(processCard).toBeVisible();
    });
});

test.describe('Theme persistence across navigation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('keeps the chosen theme across routes', async ({ page }) => {
        await page.goto('/');
        await waitForHydration(page);

        const html = page.locator('html');
        const body = page.locator('body');
        const toggle = page.getByRole('button', { name: /toggle dark mode/i });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        const initialTheme = (await html.getAttribute('data-theme')) === 'light' ? 'light' : 'dark';
        const targetTheme = initialTheme === 'dark' ? 'light' : 'dark';

        await toggle.click();

        const routes = ['/', '/quests', '/wallet', '/profile', '/stats'];
        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            await expect(html).toHaveAttribute('data-theme', targetTheme);
            await expect(body).toHaveAttribute('data-theme', targetTheme);

            const currentToggle = page.getByRole('button', { name: /toggle dark mode/i });
            await expect(currentToggle).toHaveAttribute('data-hydrated', 'true');
            await expect(currentToggle).toContainText(
                targetTheme === 'dark' ? /Dark mode/ : /Light mode/
            );
        }
    });
});

test.describe('Navigation cleanup', () => {
    test('removes Flywheel link and discourages access', async ({ page }) => {
        await page.goto('/');
        await waitForHydration(page);

        await expect(page.getByRole('link', { name: /flywheel/i })).toHaveCount(0);

        const response = await page.goto('/flywheel');
        expect(response?.status()).toBe(404);
    });
});
