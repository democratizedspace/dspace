import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Cookie consent flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('user can accept cookies and return', async ({ page }) => {
        await page.goto('/accept_cookies?redirect=/');
        const acceptLink = page.getByRole('link', { name: 'Accept cookies' });
        await expect(acceptLink).toBeVisible();

        await Promise.all([page.waitForURL('/accepted_cookies?redirect=/'), acceptLink.click()]);

        await expect(page.getByText("You've accepted cookies.")).toBeVisible();

        const cookies = await page.context().cookies();
        expect(cookies.some((c) => c.name === 'acceptedCookies' && c.value === 'true')).toBe(true);

        const goBack = page.getByRole('link', { name: 'Go back' });
        await expect(goBack).toBeVisible();
        await Promise.all([page.waitForURL('/'), goBack.click()]);
    });
});
