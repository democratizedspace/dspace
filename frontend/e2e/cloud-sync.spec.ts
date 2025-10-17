import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test.afterEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('renders upload form', async ({ page }) => {
        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect(page.getByLabel(/GitHub Token/)).toBeVisible();
        await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
    });
});
