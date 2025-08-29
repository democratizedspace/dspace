import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Legacy data import', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows upgrade path when no v1 cookies are present', async ({ page }) => {
        await page.goto('/import/v2/v1');
        await expect(page.getByRole('heading', { name: 'Upgrade from v1 to v2' })).toBeVisible();
        await expect(page.getByText("didn't play v1")).toBeVisible();
    });
});
