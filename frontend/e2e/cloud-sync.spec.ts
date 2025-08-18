import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders upload form', async ({ page }) => {
        await page.goto('/cloudsync');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByLabel(/GitHub Token/)).toBeVisible();
        await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
    });
});
