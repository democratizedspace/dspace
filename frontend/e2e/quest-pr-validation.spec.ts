import { test, expect } from '@playwright/test';
import { purgeClientState } from './test-helpers';

test.beforeEach(async ({ page }) => {
    await purgeClientState(page);
});

test('invalid token shows validation message', async ({ page }) => {
    await page.goto('/quests/submit', { waitUntil: 'domcontentloaded' });

    await page.fill('#token', 'bad');
    await page.fill('#quest', '{}');

    await page.click('button:has-text("Create Pull Request")');

    const tokenError = page.locator('.error-message', { hasText: 'GitHub token looks invalid' });
    await expect(tokenError).toBeVisible();
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});
