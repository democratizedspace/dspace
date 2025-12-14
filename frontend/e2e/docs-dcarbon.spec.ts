import { expect, test, type Page } from '@playwright/test';

const D_CARBON_SLUG = '/docs/dcarbon';

const waitForDocNavigation = (page: Page) =>
    page.waitForResponse(
        (response) =>
            response.url().includes(D_CARBON_SLUG) &&
            response.request().resourceType() === 'document'
    );

test('dCarbon doc loads from the docs search flow', async ({ page }) => {
    await page.goto('/docs');

    const searchInput = page.getByRole('searchbox', { name: /search docs/i });
    await expect(searchInput).toBeVisible();

    await searchInput.fill('dcarbon');

    const dcarbonLink = page.getByRole('link', { name: 'dCarbon' });
    await expect(dcarbonLink).toBeVisible();

    const [docResponse] = await Promise.all([waitForDocNavigation(page), dcarbonLink.click()]);

    expect(docResponse.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${D_CARBON_SLUG}$`));
    await expect(
        page.getByRole('heading', { name: /reducing your dcarbon footprint/i })
    ).toBeVisible();
    await expect(
        page.getByText('dCarbon represents the amount of carbon dioxide produced by a player', {
            exact: false,
        })
    ).toBeVisible();
});
