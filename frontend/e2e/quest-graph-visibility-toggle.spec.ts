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

        const visualizerScript = page.waitForResponse((response) =>
            /\/QuestGraphVisualizer\.[^/]+\.js$/.test(new URL(response.url()).pathname)
        );
        await page.goto('/quests');
        expect((await visualizerScript).ok()).toBe(true);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.getByTestId('quest-graph-visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();
        await expect(visualizer).toHaveCSS('border-radius', '16px');
        await expect(visualizer.locator('.card').first()).toHaveCSS('border-radius', '12px');

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizerAfterReload = page.getByTestId('quest-graph-visualizer');
        await visualizerAfterReload.scrollIntoViewIfNeeded();
        await expect(visualizerAfterReload).toBeVisible();
        await expect(visualizerAfterReload).toHaveCSS('border-radius', '16px');
        await expect(visualizerAfterReload.locator('.card').first()).toHaveCSS(
            'border-radius',
            '12px'
        );
    });
});
