import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Changelog doc placeholder', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows missing doc guidance', async ({ page }) => {
        await page.goto('/docs/changelog');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('heading', { name: /Doc not found/i })).toBeVisible();
        await expect(
            page.getByText(
                'Should something exist here? Add a file on Github and submit a pull request.',
                { exact: false }
            )
        ).toBeVisible();

        await expect(
            page.locator(
                'a[href="https://github.com/democratizedspace/dspace/new/main/frontend/pages/settings/json"]'
            )
        ).toBeVisible();
    });
});
