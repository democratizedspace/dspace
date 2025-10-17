import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.beforeEach(async ({ page }) => {
    await purgeClientState(page);
});

test('invalid token shows validation message', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForHydration(page);

    await page.getByLabel('GitHub Token*').fill('bad');
    await page.getByLabel('Quest JSON*').fill('{}');

    await page.getByRole('button', { name: 'Create Pull Request' }).click();

    await expect(page.getByTestId('token-error')).toHaveText('GitHub token looks invalid');
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});
