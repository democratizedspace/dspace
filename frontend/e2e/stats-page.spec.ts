import { test, expect } from '@playwright/test';

test.describe('Stats page', () => {
    test('surfaces quest and inventory counts', async ({ page }) => {
        await page.goto('/stats');

        await expect(page.getByRole('heading', { name: 'Game Stats' })).toBeVisible();
        await expect(page.getByTestId('stats-total-quests')).toHaveText(/\d+/);
        await expect(page.getByTestId('stats-total-items')).toHaveText(/\d+/);
        await expect(page.getByRole('row', { name: /Energy/i })).toContainText('Energy');
    });
});
