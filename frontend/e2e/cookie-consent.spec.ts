import { test, expect } from '@playwright/test';
import { clearUserData, navigateWithRetry } from './test-helpers';

test.describe('Cookie consent flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('user sees cookie-less messaging and can return', async ({ page }) => {
        await navigateWithRetry(page, '/accept_cookies?redirect=/');
        await expect(page.getByText(/no cookies required/i)).toBeVisible();

        const returnLink = page.getByRole('link', { name: /return/i });
        await expect(returnLink).toBeVisible();

        await Promise.all([page.waitForURL('/'), returnLink.click()]);

        const cookies = await page.context().cookies();
        expect(cookies.some((c) => c.name === 'acceptedCookies')).toBe(false);

        await navigateWithRetry(page, '/accepted_cookies?redirect=/');
        await expect(page.getByText(/no longer needed to save progress/i)).toBeVisible();

        const continueLink = page.getByRole('link', { name: /continue/i });
        await expect(continueLink).toBeVisible();
        await Promise.all([page.waitForURL('/'), continueLink.click()]);

        const cookiesAfter = await page.context().cookies();
        expect(cookiesAfter.some((c) => c.name === 'acceptedCookies')).toBe(false);
    });
});
