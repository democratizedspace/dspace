import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Logout flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('clears GitHub token from cloud sync', async ({ page }) => {
        const token = 'ghp_' + 'a'.repeat(36);
        await page.goto('/cloudsync');
        const tokenInput = page.locator('#token');
        await expect(tokenInput).toBeVisible();
        await tokenInput.fill(token);
        await page.getByRole('button', { name: 'Save' }).click();
        await page.getByTestId('clear-sync-token').click();
        await expect(tokenInput).toHaveValue('');
        const stored = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('gameState') || '{}').github?.token || '';
        });
        expect(stored).toBe('');
    });
});
