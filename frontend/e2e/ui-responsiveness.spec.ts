import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('UI Responsiveness Metrics', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('home page shows hydration metric', async ({ page }) => {
        await page.goto('/');
        const metric = page.getByTestId('hydration-time');
        await expect(metric).toBeVisible();
        await expect(metric).toHaveText(/Hydration time: \d+ ms/);
    });
});
