import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.beforeEach(async ({ page }) => {
    await clearUserData(page);
});

test('invalid token shows validation message', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForHydration(page);

    const tokenField = page.getByLabel('GitHub Token*');
    const questJsonField = page.getByLabel('Quest JSON*');
    const submitButton = page.getByRole('button', { name: /Create Pull Request/i });
    const tokenError = page
        .locator('.form-group')
        .filter({ has: tokenField })
        .locator('.error-message');

    await tokenField.fill('bad');
    await questJsonField.fill('{}');
    await submitButton.click();

    await expect(tokenError).toBeVisible();
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});
