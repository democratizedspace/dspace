import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest dependency graph visibility', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('is disabled by default and persists when enabled', async ({ page }) => {
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByTestId('quest-graph-visualizer')).toHaveCount(0);

        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const toggle = page.getByTestId('quest-graph-visualizer-toggle');
        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByTestId('quest-graph-visualizer')).toBeVisible();

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByTestId('quest-graph-visualizer')).toBeVisible();
    });
});
