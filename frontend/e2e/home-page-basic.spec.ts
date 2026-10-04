import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Home Page Basic Rendering', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should display the latest update section', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const latestUpdate = page.getByRole('heading', { name: /latest changelog entry/i });
        await expect(latestUpdate).toBeVisible();
        const statusNote = page.getByRole('complementary', { name: 'Historical note' });
        await expect(statusNote).toContainText('tentative November 1, 2026');
        await expect(
            statusNote.getByRole('link', { name: 'v3.1 release preparation' })
        ).toHaveAttribute('href', '/docs/v3-1-release-preparation');
    });
});
