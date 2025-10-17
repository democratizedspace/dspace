import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest Form Live Validation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows inline errors and clears them when inputs become valid', async ({ page }) => {
        await page.goto('/quests/create');
        await waitForHydration(page);

        const titleField = page.locator('.form-group').filter({ has: page.getByLabel('Title*') });
        const descriptionField = page
            .locator('.form-group')
            .filter({ has: page.getByLabel('Description*') });

        const titleInput = titleField.getByLabel('Title*');
        const descriptionInput = descriptionField.getByLabel('Description*');
        const titleError = titleField.locator('.error-message');
        const descriptionError = descriptionField.locator('.error-message');

        // Typing too short of a title should surface the length validation copy
        await titleInput.fill('ab');
        await expect(titleError).toHaveText('Title must be at least 3 characters');

        // Short descriptions should raise the minimum length validation message
        await descriptionInput.fill('short');
        await expect(descriptionError).toHaveText('Description must be at least 10 characters');

        // When both fields become valid, the inline validation should clear
        await titleInput.fill('Rescue the historian');
        await descriptionInput.fill('Retrieve the lost archives from the orbital library.');
        await expect(titleError).toBeHidden();
        await expect(descriptionError).toBeHidden();
    });
});
