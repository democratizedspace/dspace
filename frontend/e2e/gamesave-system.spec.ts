import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Game Save System', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('has no manual save UI', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const saveButton = page.locator('button, a').filter({ hasText: /save game|save$/i });
        await expect(saveButton).toHaveCount(0);
    });

    test('auto-saves game state', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.evaluate(() => localStorage.clear());

        await page.goto('/inventory');
        await page.waitForTimeout(500);
        await page.goto('/');
        await page.waitForTimeout(500);

        await page.reload();
        const hasState = await page.evaluate(() =>
            Object.keys(localStorage).some((key) => key.includes('gameState'))
        );
        expect(hasState).toBeTruthy();
    });

    test('gamesaves page is not present', async ({ page }) => {
        const response = await page.goto('/gamesaves');
        await page.waitForLoadState('networkidle');
        const status = response?.status() ?? 200;
        const content = await page.content();
        expect(status === 404 || content.toLowerCase().includes('not found')).toBeTruthy();
    });
});
