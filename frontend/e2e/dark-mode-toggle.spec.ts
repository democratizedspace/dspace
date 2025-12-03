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
        const toggle = page.getByRole('button', { name: /toggle dark mode/i });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        const initialTheme = (await html.getAttribute('data-theme')) === 'light' ? 'light' : 'dark';
        const toggledTheme = initialTheme === 'dark' ? 'light' : 'dark';

        await expect(html).toHaveAttribute('data-theme', initialTheme);
        await expect(body).toHaveAttribute('data-theme', initialTheme);
        await expect(toggle).toHaveAttribute(
            'aria-pressed',
            initialTheme === 'dark' ? 'true' : 'false'
        );

        await toggle.click();

        await expect(html).toHaveAttribute('data-theme', toggledTheme);
        await expect(body).toHaveAttribute('data-theme', toggledTheme);
        await expect(toggle).toHaveAttribute(
            'aria-pressed',
            toggledTheme === 'dark' ? 'true' : 'false'
        );
        await expectLocalStorageValue(page, 'dspace-theme', toggledTheme);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(html).toHaveAttribute('data-theme', toggledTheme);
        await expect(body).toHaveAttribute('data-theme', toggledTheme);
        await expect(page.getByRole('button', { name: /toggle dark mode/i })).toHaveAttribute(
            'aria-pressed',
            toggledTheme === 'dark' ? 'true' : 'false'
        );
        await expectLocalStorageValue(page, 'dspace-theme', toggledTheme);
    });
});
