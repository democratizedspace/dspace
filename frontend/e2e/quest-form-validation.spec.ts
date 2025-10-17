import { test, expect } from '@playwright/test';
import { purgeClientState } from './test-helpers';

test.describe('Quest Form Live Validation', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('shows inline errors and clears them when inputs become valid', async ({ page }) => {
        await page.goto('/quests/create', { waitUntil: 'domcontentloaded' });

        const titleInput = page.locator('#title');
        const descriptionInput = page.locator('#description');
        const titleError = page.locator('.form-group:has(#title) .error-message');
        const descriptionError = page.locator('.form-group:has(#description) .error-message');

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
