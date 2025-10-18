import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Error Pages', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('404 page should display appropriate error message', async ({ page }) => {
        // Go to a non-existent page
        await page.goto('/non-existent-page-123');

        // Verify error page is displayed - using a more specific selector
        const errorHeading = page.locator('h2:has-text("404")');
        await expect(errorHeading).toBeVisible();

        // Verify there's a way to navigate back to home
        const homeLink = page.locator('a:has-text("Home"), a:has-text("Go back")');
        await expect(homeLink).toBeVisible();
    });

    test('404 page should provide navigation options', async ({ page }) => {
        // Go to a non-existent page
        await page.goto('/another-non-existent-path');

        // Look for navigation options
        const navigationLinks = page.locator('a');

        // Wait for navigation links to be available and count them correctly
        // First wait for at least one link to be visible
        await expect(page.locator('a').first()).toBeVisible();

        // Then check the count
        const count = await navigationLinks.count();
        expect(count).toBeGreaterThan(0);

        // Check for common navigation links
        const homeLink = page.locator('a:has-text("Home")');
        if ((await homeLink.count()) > 0) {
            // Click home link
            await homeLink.click();

            // Verify we navigated to home page - use a pattern that will match the full URL
            const currentUrl = new URL(page.url());
            expect(['127.0.0.1', 'localhost']).toContain(currentUrl.hostname);
            expect(currentUrl.pathname).toBe('/');
        }
    });

    test('error page should have consistent styling with the rest of the app', async ({ page }) => {
        // First visit home page to get reference
        await page.goto('/');

        // Capture selectors for consistent elements
        const header = page.locator('header');
        const logo = page.locator('img.logo');
        const footer = page.locator('footer');

        // Store whether these elements exist on the home page
        const hasHeader = (await header.count()) > 0;
        const hasLogo = (await logo.count()) > 0;
        const hasFooter = (await footer.count()) > 0;

        // Now visit error page
        await page.goto('/non-existent-page-456');

        // Check for same elements on error page
        if (hasHeader) {
            await expect(header).toBeVisible();
        }

        if (hasLogo) {
            await expect(logo).toBeVisible();
        }

        if (hasFooter) {
            await expect(footer).toBeVisible();
        }
    });
});
