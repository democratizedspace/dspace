import { test, expect } from '@playwright/test';
import {
    clearUserData,
    expectLocalStorageValue,
    gotoAndWaitForHydration,
    waitForHydration,
} from './test-helpers';

test.describe('Profile avatar selection', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('selects an avatar and shows it on the profile page', async ({ page }) => {
        const selectButton = page.getByRole('button', { name: 'Select', exact: true });
        const firstAvatarOption = page.getByRole('button', {
            name: 'Select avatar 1',
            exact: true,
        });
        const firstAvatarImage = page.getByRole('img', { name: 'Avatar option 1' });

        await gotoAndWaitForHydration(page, '/profile/avatar', {
            hydrationTarget: firstAvatarOption,
        });

        await expect(selectButton).toBeDisabled();
        await expect(firstAvatarOption).toHaveAttribute('aria-pressed', 'false');

        const selectedSrc = await firstAvatarImage.getAttribute('src');
        if (!selectedSrc) {
            throw new Error('Expected avatar option to expose a src attribute');
        }

        await firstAvatarOption.click();

        await expect(firstAvatarOption).toHaveAttribute('aria-pressed', 'true');
        await expect(selectButton).toBeEnabled();

        await Promise.all([page.waitForURL(/\/profile$/), selectButton.click()]);

        await waitForHydration(page);

        await expectLocalStorageValue(page, 'avatarUrl', selectedSrc);
        await expect(page.getByAltText('your currently selected avatar')).toHaveAttribute(
            'src',
            selectedSrc
        );
    });
});
