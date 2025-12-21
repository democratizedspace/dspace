import { test, expect } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test.describe('Stats page', () => {
    test('surfaces quest and inventory counts', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { name: 'Game Stats' })).toBeVisible();
        await expect(page.getByTestId('stats-total-quests')).toHaveText(/\d+/);
        await expect(page.getByTestId('stats-total-items')).toHaveText(/\d+/);
        await expect(page.getByTestId('stats-total-processes')).toHaveText(/\d+/);
        await expect(page.getByRole('row', { name: /Energy/i })).toContainText('Energy');

        const questCard = page
            .getByRole('heading', { name: 'Quest overview' })
            .locator('xpath=ancestor::li[1]');
        const inventoryCard = page
            .getByRole('heading', { name: 'Inventory overview' })
            .locator('xpath=ancestor::li[1]');
        const processCard = page
            .getByRole('heading', { name: 'Process overview' })
            .locator('xpath=ancestor::li[1]');

        await expect(questCard).not.toHaveAttribute('aria-disabled', 'true');
        await expect(inventoryCard).not.toHaveAttribute('aria-disabled', 'true');
        await expect(processCard).not.toHaveAttribute('aria-disabled', 'true');
    });
});
