import { expect, test } from '@playwright/test';
import {
    clearUserData,
    expectLocalStorageValue,
    gotoAndWaitForHydration,
    waitForHydration,
} from './test-helpers';

test.describe('Dark mode toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('persists theme preference between sessions', async ({ page }) => {
        const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
        await gotoAndWaitForHydration(page, '/', { hydrationTarget: toggle });

        const html = page.locator('html');

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        await expect(html).toHaveAttribute('data-theme', 'dark');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expectLocalStorageValue(page, 'theme', 'dark');

        await toggle.click();

        await expect(html).toHaveAttribute('data-theme', 'light');
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expectLocalStorageValue(page, 'theme', 'light');

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, toggle);

        await expect(html).toHaveAttribute('data-theme', 'light');
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expectLocalStorageValue(page, 'theme', 'light');
    });
});
