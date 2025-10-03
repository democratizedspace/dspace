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

    const tokenError = page.locator('.error-message', { hasText: 'GitHub token looks invalid' });
    await expect(tokenError).toBeVisible();
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});
