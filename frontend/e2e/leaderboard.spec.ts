import { test, expect } from '@playwright/test';

test.describe('Leaderboard page', () => {
    test('highlights top donors and personal progress', async ({ page }) => {
        await page.goto('/leaderboard');

        await expect(
            page.getByRole('heading', { name: 'Metaguild Donation Leaderboard' })
        ).toBeVisible();
        await expect(page.getByRole('table', { name: /donation leaderboard/i })).toBeVisible();
        await expect(page.getByRole('row', { name: /Nova/ })).toContainText('Nova');
        await expect(page.getByRole('region', { name: /Your contributions/i })).toBeVisible();
    });
});
