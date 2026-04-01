import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

const DEFAULT_AVATAR = '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

test.describe('Profile avatar selection', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows the default avatar when none is selected', async ({ page }) => {
        await page.goto('/profile/avatar');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, 'data-testid=avatar-picker');

        const headerAvatar = page.getByTestId('header-avatar');
        await expect(headerAvatar).toBeVisible();
        await expect(headerAvatar).toHaveAttribute('src', DEFAULT_AVATAR);

        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const profileAvatar = page.getByAltText('your currently selected avatar');
        await expect(profileAvatar).toBeVisible();
        await expect(profileAvatar).toHaveAttribute('src', DEFAULT_AVATAR);
    });

    test('selects an avatar and shows it on the profile page', async ({ page }) => {
        await page.goto('/profile/avatar');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, 'data-testid=avatar-picker');

        const avatarOption = page.getByRole('button', { name: 'Select avatar 1', exact: true });
        const selectButton = page.getByRole('button', { name: 'Select', exact: true });

        await expect(selectButton).toBeDisabled();
        await avatarOption.click();
        await expect(selectButton).toBeEnabled();

        await Promise.all([page.waitForURL(/\/profile$/), selectButton.click()]);

        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expectLocalStorageValue(page, 'avatarUrl', /(\/assets\/pfp\/|\/_astro\/).+\.jpg$/);
        await expect(page.getByAltText('your currently selected avatar')).toBeVisible();

        const storedAvatar = await page.evaluate(() => localStorage.getItem('avatarUrl'));
        await expect(page.getByTestId('header-avatar')).toHaveAttribute('src', storedAvatar ?? '');
    });
});
