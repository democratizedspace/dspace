import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const DCARBON_DOC_PATH = '/docs/dCarbon';

const DCARBON_INTRO_SNIPPET =
    'dCarbon represents the amount of carbon dioxide produced by a player in the game';

test.describe('dCarbon documentation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('opens the dCarbon doc from search results', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await expect(searchInput).toBeVisible();

        await searchInput.fill('dcarbon');

        const dCarbonLink = page.getByRole('link', { name: 'dCarbon', exact: true });
        await expect(dCarbonLink).toBeVisible();

        await dCarbonLink.click();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page).toHaveURL(new RegExp(`${DCARBON_DOC_PATH}$`, 'i'));

        const docHeading = page.getByRole('heading', { name: 'dCarbon', exact: true }).first();
        await expect(docHeading).toBeVisible();

        await expect(page.getByText(DCARBON_INTRO_SNIPPET, { exact: false })).toBeVisible();
    });
});
