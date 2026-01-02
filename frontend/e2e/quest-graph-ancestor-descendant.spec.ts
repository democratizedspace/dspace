import { test, expect, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            nodes: (
                selector?: string
            ) => {
                first: () => { id: () => string; empty: () => boolean };
                map: <T>(mapper: (element: { id: () => string }) => T) => T[];
            };
        };
    }
}

const waitForQuestGraph = async (page: Page) => {
    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });
};

const getHighlightState = async (page: Page) => {
    return page.evaluate(() => {
        const cy = window.__questGraphCy;
        const toIdList = (nodes?: { map: (mapper: (node: { id: () => string }) => string) => string[] }) => {
            return (
                nodes?.map((node) => {
                    if (!node?.id) return null;
                    const value = node.id();
                    return typeof value === 'string' ? value : null;
                }) ?? []
            ).filter(Boolean);
        };

        const focused = cy?.nodes('.focused').first();
        return {
            focusedId: focused && !focused.empty() ? focused.id() : null,
            ancestors: toIdList(cy?.nodes('.highlight-ancestor')),
            descendants: toIdList(cy?.nodes('.highlight-descendant')),
        };
    });
};

test.describe('Quest graph ancestor/descendant highlighting', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('highlights multi-hop ancestors and descendants from map toggles', async ({ page }) => {
        await page.goto('/quests/fixtures/graph');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const leafCard = page.getByRole('button', { name: 'Fixture Leaf Quest' });
        await expect(leafCard).toBeVisible();
        await leafCard.click();

        const mapTab = page.getByRole('tab', { name: 'Map' });
        await mapTab.click();
        await waitForQuestGraph(page);

        const ancestorToggle = page.getByLabel('Highlight all ancestors');
        const descendantToggle = page.getByLabel('Highlight all descendants');
        const neighborToggle = page.getByLabel('Highlight direct neighbors');

        await expect(neighborToggle).toBeChecked();
        await ancestorToggle.check();

        const leafHighlightState = await getHighlightState(page);
        expect(leafHighlightState.focusedId).toBe('fixtures/leaf.json');
        expect(leafHighlightState.ancestors).toEqual(
            expect.arrayContaining([
                'fixtures/child.json',
                'fixtures/parent.json',
                'welcome/howtodoquests.json',
            ])
        );

        const rootButton = page.getByRole('button', { name: 'Root' }).first();
        await rootButton.click();
        await descendantToggle.check();

        const rootHighlightState = await getHighlightState(page);
        expect(rootHighlightState.focusedId).toBe('welcome/howtodoquests.json');
        expect(rootHighlightState.descendants).toEqual(
            expect.arrayContaining(['fixtures/parent.json', 'fixtures/child.json', 'fixtures/leaf.json'])
        );
    });
});
