import { expect, test } from '@playwright/test';

test('About page loads', async ({ page }) => {
    await page.goto('/docs/about');
    await expect(page.getByRole('heading', { name: 'About DSPACE' })).toBeVisible();
});
