import { test, expect } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test.describe('touch navigation menu', () => {
    test.use({ hasTouch: true });

    test('unpinned menu toggles via touch', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const toggle = page.getByRole('button', { name: 'Toggle additional menu items' });
        const unpinnedMenu = page.getByRole('region', { name: 'Additional menu items' });
        const unpinnedItem = unpinnedMenu.getByRole('link', {
            name: 'Import/export gamesaves',
            exact: true,
        });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveText('More');
        await expect(unpinnedMenu).toBeHidden();

        await toggle.tap();

        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(toggle).toHaveText('Less');
        await expect(unpinnedMenu).toBeVisible();
        await expect(unpinnedItem).toBeVisible();

        await toggle.tap();

        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(unpinnedMenu).toBeHidden();
    });
});
