import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('quest creation shows success message', async ({ page }) => {
    await clearUserData(page);
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');

    const title = `Success Quest ${Date.now()}`;
    await page.fill('#title', title);
    await page.fill('#description', 'Check success message');
    const imagePath = path.resolve(__dirname, '../test-data/test-image.jpg');
    await page.setInputFiles('input[type="file"]', imagePath);
    await page.locator('button.submit-button').click();
    await page.waitForLoadState('networkidle');

    const msg = page.locator('.success-message');
    await expect(msg).toBeVisible({ timeout: 10000 });
    await expect(msg).toContainText('Quest created successfully');
    await expect(msg.locator('a.view-link')).toHaveText('View quest');
});
