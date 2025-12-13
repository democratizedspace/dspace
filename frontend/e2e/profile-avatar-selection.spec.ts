import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

test.describe('Profile avatar selection', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
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

        const storedAvatarUrl = await page.evaluate(() => localStorage.getItem('avatarUrl'));
        const headerAvatar = page.getByTestId('header-avatar').locator('img');
        const escapeForRegex = (value: string) => value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
        const escapedAvatarUrl = storedAvatarUrl ? escapeForRegex(storedAvatarUrl) : '';

        expect(storedAvatarUrl).toBeTruthy();
        await expect(headerAvatar).toHaveAttribute('src', new RegExp(`${escapedAvatarUrl}$`));
    });
});
