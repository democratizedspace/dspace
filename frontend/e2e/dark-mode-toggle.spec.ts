import { expect, test } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

test.describe('Dark mode toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('persists theme preference across navigation and reloads', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const html = page.locator('html');
        const body = page.locator('body');
        const toggle = page.getByRole('button', { name: /toggle dark mode/i });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        const initialTheme = (await html.getAttribute('data-theme')) ?? 'dark';
        await toggle.click();

        const expectedTheme = initialTheme === 'light' ? 'dark' : 'light';
        const expectedPressed = expectedTheme === 'dark' ? 'true' : 'false';
        const expectedLabel = expectedTheme === 'dark' ? /Dark mode/i : /Light mode/i;

        await expect(html).toHaveAttribute('data-theme', expectedTheme);
        await expect(body).toHaveAttribute('data-theme', expectedTheme);
        await expect(toggle).toHaveAttribute('aria-pressed', expectedPressed);
        await expect(toggle).toHaveText(expectedLabel);
        await expectLocalStorageValue(page, 'dspace-theme', expectedTheme);

        const routes = ['/quests', '/wallet', '/profile', '/leaderboard'];
        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            await expect(html).toHaveAttribute('data-theme', expectedTheme);
            await expect(body).toHaveAttribute('data-theme', expectedTheme);
            await expect(page.getByRole('button', { name: /toggle dark mode/i })).toHaveText(
                expectedLabel
            );
        }

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(html).toHaveAttribute('data-theme', expectedTheme);
        await expect(body).toHaveAttribute('data-theme', expectedTheme);
        await expect(page.getByRole('button', { name: /toggle dark mode/i })).toHaveAttribute(
            'aria-pressed',
            expectedPressed
        );
        await expectLocalStorageValue(page, 'dspace-theme', expectedTheme);
    });
});
