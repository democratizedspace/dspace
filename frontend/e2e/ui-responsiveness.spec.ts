import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('UI Responsiveness Metrics', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('home page shows hydration metric', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const metric = page.getByTestId('hydration-time');
        await expect(metric).toHaveAttribute('data-hydrated', 'true');
        await expect(metric).toBeVisible();
        await expect(metric).toHaveText(/Hydration time: \d+ ms/);
    });
});
