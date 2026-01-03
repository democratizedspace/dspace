import { test, expect } from '@playwright/test';
import { clearUserData, enableQuestGraphVisualizer, waitForHydration } from './test-helpers';

test.describe('Quest graph visibility toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('is hidden by default and persists when enabled', async ({ page }) => {
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByTestId('quest-graph-visualizer')).toHaveCount(0);

        await enableQuestGraphVisualizer(page);

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.getByTestId('quest-graph-visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizerAfterReload = page.getByTestId('quest-graph-visualizer');
        await visualizerAfterReload.scrollIntoViewIfNeeded();
        await expect(visualizerAfterReload).toBeVisible();
    });
});
