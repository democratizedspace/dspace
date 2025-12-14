import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('dCarbon docs', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads via docs search and shows conversion guidance', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await expect(searchInput).toBeVisible();

        await searchInput.fill('carbon');

        const dcarbonLink = page.getByRole('link', { name: 'dCarbon', exact: true });
        await expect(dcarbonLink).toBeVisible();

        await dcarbonLink.click();
        await page.waitForURL(/\/docs\/dCarbon$/);
        await page.waitForLoadState('networkidle');

        await expect(
            page.getByText('dCarbon represents the amount of carbon dioxide produced by a player')
        ).toBeVisible();
        await expect(page.getByText(/dCarbon to dOffset/i)).toBeVisible();
    });
});
