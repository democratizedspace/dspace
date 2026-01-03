import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph visibility setting', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('is hidden by default and persists when enabled', async ({ page }) => {
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.getByTestId('quest-graph-visualizer');
        await expect(visualizer).toHaveCount(0);

        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.getByTestId('quest-graph-toggle').click();

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const enabledVisualizer = page.getByTestId('quest-graph-visualizer');
        await enabledVisualizer.scrollIntoViewIfNeeded();
        await expect(enabledVisualizer).toBeVisible();

        await page.reload({ waitUntil: 'networkidle' });
        await waitForHydration(page);

        const persistedVisualizer = page.getByTestId('quest-graph-visualizer');
        await persistedVisualizer.scrollIntoViewIfNeeded();
        await expect(persistedVisualizer).toBeVisible();
    });
});
