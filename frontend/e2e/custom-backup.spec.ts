import { test, expect } from '@playwright/test';

test('custom content backup page renders', async ({ page }) => {
    await page.goto('/contentbackup');
    await expect(page.getByText('Custom content backup string:')).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy/i })).toBeVisible();
});
