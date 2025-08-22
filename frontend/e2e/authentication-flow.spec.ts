import { test, expect } from '@playwright/test';

test('Authentication flow saves and clears token', async ({ page }) => {
    const token = 'ghp_' + 'a'.repeat(36);
    await page.goto('/cloudsync');

    const tokenInput = page.locator('#token');
    await tokenInput.fill(token);
    await page.getByRole('button', { name: 'Save' }).click();

    // token persisted in localStorage and reload retains it
    const stored = await page.evaluate(
        () => JSON.parse(localStorage.getItem('gameState') || '{}').github?.token || ''
    );
    expect(stored).toBe(token);

    await page.reload();
    await expect(page.locator('#token')).toHaveValue(token);

    // clear token and verify removal
    await page.getByTestId('clear-sync-token').click();
    await expect(page.locator('#token')).toHaveValue('');
    const cleared = await page.evaluate(
        () => JSON.parse(localStorage.getItem('gameState') || '{}').github?.token || ''
    );
    expect(cleared).toBe('');
});
