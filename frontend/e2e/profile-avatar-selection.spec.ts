import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

test.describe('Profile avatar selection', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('selects an avatar and shows it on the profile page', async ({ page }) => {
        await page.goto('/profile/avatar');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.getByRole('button', { name: 'Select avatar 1', exact: true }).click();
        await Promise.all([
            page.waitForURL(/\/profile$/),
            page.getByRole('button', { name: 'Select', exact: true }).click(),
        ]);

        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expectLocalStorageValue(page, 'avatarUrl', /\/assets\/pfp\//);
        await expect(page.getByAltText('your currently selected avatar')).toBeVisible();
    });
});
