import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const headerViewports = [
    { name: 'desktop', viewport: { width: 1280, height: 720 } },
    { name: 'mobile', viewport: { width: 480, height: 900 } },
];

for (const { name, viewport } of headerViewports) {
    test.describe(`Header layout (${name})`, () => {
        test.use({ viewport });

        test('centers brand and keeps toggle visible', async ({ page }) => {
            await page.goto('/');
            await waitForHydration(page);

            const header = page.locator('header.header');
            const brand = page.locator('header .brand');
            const toggle = page.getByRole('button', { name: /toggle dark mode/i });

            const headerBox = await header.boundingBox();
            const brandBox = await brand.boundingBox();
            const toggleBox = await toggle.boundingBox();

            if (!headerBox || !brandBox || !toggleBox) {
                throw new Error('Unable to measure header layout');
            }

            const headerCenter = headerBox.x + headerBox.width / 2;
            const brandCenter = brandBox.x + brandBox.width / 2;
            const toggleRightGap = headerBox.x + headerBox.width - (toggleBox.x + toggleBox.width);

            expect(Math.abs(headerCenter - brandCenter)).toBeLessThanOrEqual(8);
            expect(toggleRightGap).toBeLessThanOrEqual(48);
            expect(toggleBox.x).toBeGreaterThan(headerCenter);
        });
    });
}

test.describe('Wallet page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders balances and the basic income card', async ({ page }) => {
        const response = await page.goto('/wallet');
        expect(response?.status()).toBeLessThan(400);

        await waitForHydration(page);

        const balancesSection = page.getByTestId('wallet-balance-section');
        await expect(balancesSection).toBeVisible();

        const balanceRows = page.locator('[data-testid^="wallet-balance-"]');
        expect(await balanceRows.count()).toBeGreaterThan(0);

        const valueText = await balanceRows.first().textContent();
        expect(valueText?.trim().length ?? 0).toBeGreaterThan(0);

        const processCard = page.getByTestId('wallet-process-card');
        await expect(processCard).toBeVisible();
        await expect(processCard).toContainText(/basic income/i);
        await expect(processCard).toContainText(/dUSD/i);
    });
});

test.describe('Navigation cleanup', () => {
    test('omits Flywheel from the menu', async ({ page }) => {
        await page.goto('/');
        await waitForHydration(page);

        const flywheelLinks = page.getByRole('link', { name: /flywheel/i });
        await expect(flywheelLinks).toHaveCount(0);
    });
});
