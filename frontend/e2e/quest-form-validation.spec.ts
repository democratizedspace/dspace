import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Quest Form Live Validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserData(page);
  });

  test('shows validation errors while typing', async ({ page }) => {
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('#title');
    const descInput = page.locator('#description');

    await titleInput.fill('ab');
    await expect(page.locator('.error-message')).toContainText('at least 3 characters');

    await descInput.fill('short');
    await expect(page.locator('.error-message')).toContainText('at least 10 characters');
  });
});
