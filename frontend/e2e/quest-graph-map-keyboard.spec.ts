import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

type QuestNodeElement = {
    id: () => string;
    empty: () => boolean;
    outgoers: (selector?: string) => { first: () => QuestNodeElement };
};

declare global {
    interface Window {
        __questGraphCy?: {
            nodes: (selector?: string) => { first: () => QuestNodeElement };
        };
    }
}

test.describe('Quest graph map keyboard accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('allows keyboard navigation to update focus and switch tabs', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        const mapTab = page.getByRole('tab', { name: 'Map' });
        await mapTab.focus();
        await page.keyboard.press('Enter');

        const mapPanel = page.getByTestId('quest-graph-panel-map');
        await expect(mapTab).toHaveAttribute('aria-selected', 'true');
        await expect(mapPanel).toBeVisible();
        await expect(page.getByTestId('focused-quest-strip')).toBeVisible();

        await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });

        const { rootId, childId } = await page.evaluate<{
            rootId: string | null;
            childId: string | null;
        }>(() => {
            const cy = window.__questGraphCy;
            const root = cy?.nodes('.root').first();
            const child = root?.outgoers('node').first();

            return {
                rootId: !root || root.empty() ? null : root.id(),
                childId: !child || child.empty() ? null : child.id(),
            };
        });

        expect(rootId).not.toBeNull();
        if (!rootId) return;

        await expect(page.getByTestId('focused-quest-key')).toHaveText(rootId);

        if (!childId) {
            test.skip();
            return;
        }

        await mapPanel.focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByTestId('focused-quest-key')).toHaveText(childId);

        await mapTab.focus();
        await page.keyboard.press('Enter');

        const navigatorTab = page.getByRole('tab', { name: 'Navigator' });
        await expect(navigatorTab).toHaveAttribute('aria-selected', 'true');
    });
});
