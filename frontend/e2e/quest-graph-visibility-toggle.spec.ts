import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest dependency map visibility', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('is disabled by default and can be enabled with persistence', async ({ page }) => {
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByTestId('quest-graph-visualizer')).toHaveCount(0);

        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const toggle = page.getByTestId('quest-graph-visibility-toggle');
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.getByTestId('quest-graph-visualizer');
        await expect(visualizer).toHaveCount(1);
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizerAfterReload = page.getByTestId('quest-graph-visualizer');
        await expect(visualizerAfterReload).toHaveCount(1);
    });
});
