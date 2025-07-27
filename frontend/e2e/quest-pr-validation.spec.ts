import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.beforeEach(async ({ page }) => {
    await clearUserData(page);
});

test('invalid token shows validation message', async ({ page }) => {
    await page.goto('/quests/submit');
    await page.waitForLoadState('networkidle');

    await page.fill('#token', 'bad');
    await page.fill('#quest', '{}');

    await page.click('button:has-text("Create Pull Request")');

    const error = page.locator('.error-message');
    await expect(error).toBeVisible();
});
