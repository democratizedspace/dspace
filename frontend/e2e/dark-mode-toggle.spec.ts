import { expect, test } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

test.describe('Dark mode toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('persists theme preference between sessions', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const html = page.locator('html');
        const body = page.locator('body');
        const toggle = page.getByTestId('theme-toggle');

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        await expect(html).toHaveAttribute('data-theme', 'dark');
        await expect(body).toHaveAttribute('data-theme', 'dark');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await toggle.click();

        await expect(html).toHaveAttribute('data-theme', 'light');
        await expect(body).toHaveAttribute('data-theme', 'light');
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expectLocalStorageValue(page, 'dspace-theme', 'light');

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(html).toHaveAttribute('data-theme', 'light');
        await expect(body).toHaveAttribute('data-theme', 'light');
        await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-pressed', 'false');
        await expectLocalStorageValue(page, 'dspace-theme', 'light');
    });
});
