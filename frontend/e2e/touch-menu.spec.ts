import { test, expect } from '@playwright/test';
import { gotoAndWaitForHydration } from './test-helpers';

test.describe('touch navigation menu', () => {
    test.use({ hasTouch: true });

    test('unpinned menu toggles via touch', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        const toggle = page.getByRole('button', { name: 'Toggle additional menu items' });
        const gamesavesLink = page.getByRole('link', { name: 'Import/export gamesaves' });

        await gotoAndWaitForHydration(page, '/', { hydrationTarget: toggle });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveText('More');
        await expect(gamesavesLink).toBeHidden();

        await toggle.tap();

        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(toggle).toHaveText('Less');
        await expect(gamesavesLink).toBeVisible();

        await toggle.tap();

        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(gamesavesLink).toBeHidden();
    });
});
