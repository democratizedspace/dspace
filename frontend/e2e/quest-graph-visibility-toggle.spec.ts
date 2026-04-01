import { test, expect, type Request } from '@playwright/test';
import { clearUserData, enableQuestGraphVisualizer, waitForHydration } from './test-helpers';

test.describe('Quest graph visibility toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('is hidden by default and persists when enabled', async ({ page }) => {
        const trackedChunkRequests: string[] = [];
        const blockedPatterns = [
            /QuestGraphVisualizer/i,
            /quest-graph/i,
            /cytoscape/i,
            /elk/i,
            /dagre/i,
        ];
        let trackRequests = true;
        const requestListener = (request: Request) => {
            if (!trackRequests) return;
            const url = request.url();
            if (blockedPatterns.some((pattern) => pattern.test(url))) {
                trackedChunkRequests.push(url);
            }
        };

        page.on('request', requestListener);

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByTestId('quest-graph-visualizer')).toHaveCount(0);
        expect(trackedChunkRequests).toEqual([]);

        trackRequests = false;
        page.off('request', requestListener);

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
