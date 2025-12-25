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
        const inventoryTable = page.getByRole('table', { name: /Inventory by category/i });
        await expect(inventoryTable.getByRole('row', { name: /Energy/i }).first()).toContainText(
            'Energy'
        );
    });
});
