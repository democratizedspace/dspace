import { test, expect } from '@playwright/test';

test('Authentication flow saves and clears token', async ({ page }) => {
    const token = 'ghp_' + 'a'.repeat(36);
    page.on('dialog', (d) => d.accept());
    await page.goto('/cloudsync');

    const tokenInput = page.locator('#token');
    await tokenInput.fill(token);
    await page.getByRole('button', { name: 'Save' }).click();

    await page.reload();
    await expect(tokenInput).toHaveValue(token);

    // clear token and verify removal
    await page.getByTestId('clear-sync-token').click();
    await expect(tokenInput).toHaveValue('');
});
