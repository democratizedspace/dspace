import { expect, test } from '@playwright/test';
import { waitForHydration } from './test-helpers';

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
