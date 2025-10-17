import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.beforeEach(async ({ page }) => {
    await purgeClientState(page);
});

test('invalid token shows validation message', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForHydration(page);

    const tokenInput = page.getByLabel('GitHub Token*');
    await tokenInput.fill('bad');
    await page.getByLabel('Quest JSON*').fill('{}');

    await page.getByRole('button', { name: /Create Pull Request/i }).click();

    const tokenError = tokenInput.locator('..').locator('.error-message');
    await expect(tokenError).toBeVisible();
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});
