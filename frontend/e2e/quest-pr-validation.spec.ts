import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.beforeEach(async ({ page }) => {
    await clearUserData(page);
});

test('invalid token shows validation message', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForHydration(page);

    const tokenField = page.getByLabel('GitHub Token*');
    const questField = page.getByLabel('Quest JSON*');

    await tokenField.fill('bad');
    await questField.fill('{}');

    await page.getByRole('button', { name: /^Create Pull Request$/ }).click();

    await expect(page.getByTestId('quest-token-error')).toBeVisible();
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});
