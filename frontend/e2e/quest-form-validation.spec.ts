import { test, expect } from '@playwright/test';

// Basic validation test for QuestForm
// Ensures required fields trigger validation errors

test('quest form requires description and image', async ({ page }) => {
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');

    // Fill only the title
    await page.fill('#title', 'Validation Test Quest');

    // Attempt to submit without description or image
    await page.click('button.submit-button');

    // Expect error messages to appear
    const errors = page.locator('.error-message');
    await expect(errors.first()).toBeVisible();

    // Ensure we stay on the creation page
    await expect(page).toHaveURL(/\/quests\/create/);
});
