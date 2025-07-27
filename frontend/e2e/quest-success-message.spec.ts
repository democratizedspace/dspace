import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test('quest creation shows success message', async ({ page }) => {
    await clearUserData(page);
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');
    await page.fill('#title', 'Success Quest');
    await page.fill('#description', 'Check success message');
    await page.locator('button.submit-button').click();
    const msg = page.locator('.success-message');
    await expect(msg).toBeVisible();
    await expect(msg).toContainText('Quest created successfully');
});
