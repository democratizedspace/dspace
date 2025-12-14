import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('dCarbon docs page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads from docs search without server errors', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await expect(searchInput).toBeVisible();

        await searchInput.fill('carbon');

        const dCarbonLink = page.getByRole('link', { name: 'dCarbon', exact: true });
        await expect(dCarbonLink).toBeVisible();

        await Promise.all([page.waitForNavigation(), dCarbonLink.click()]);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page).toHaveURL(/\/docs\/dCarbon/i);
        await expect(page.getByRole('heading', { name: 'dCarbon' })).toBeVisible();
        await expect(
            page.getByText('dCarbon represents the amount of carbon dioxide produced by a player')
        ).toBeVisible();
    });
});
