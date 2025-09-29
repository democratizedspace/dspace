import { expect, test } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Dark mode toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('persists theme preference between sessions', async ({ page }) => {
        await page.goto('/');
        const html = page.locator('html');
        const toggle = page.getByRole('button', { name: /toggle dark mode/i });

        await expect(html).toHaveAttribute('data-theme', 'dark');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await toggle.click();

        await expect(html).toHaveAttribute('data-theme', 'light');
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');

        await page.reload();

        await expect(html).toHaveAttribute('data-theme', 'light');
        await expect(page.getByRole('button', { name: /toggle dark mode/i })).toHaveAttribute(
            'aria-pressed',
            'false'
        );
    });
});
