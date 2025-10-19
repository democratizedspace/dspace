import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('User journeys documentation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows coverage table', async ({ page }) => {
        await page.goto('/docs/user-journeys');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('heading', { level: 1, name: /user journeys/i })).toBeVisible();
        const table = page.locator('table');
        await expect(table).toBeVisible();
        await expect(table).toContainText('Journey');
    });
});
