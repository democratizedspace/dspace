import { test, expect, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            edges: () => {
                forEach: (
                    callback: (edge: {
                        source: () => { id: () => string };
                        target: () => { id: () => string };
                    }) => void
                ) => void;
            };
            nodes: () => { toArray: () => Array<{ id: () => string }> };
            getElementById: (id: string) => {
                trigger: (event: string) => void;
                hasClass: (name: string) => boolean;
                empty: () => boolean;
            };
        };
    }
}

const loadQuestGraphMap = async (page: Page) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/quests');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);

    const visualizer = page.locator('.visualizer');
    await visualizer.scrollIntoViewIfNeeded();
    await expect(visualizer).toBeVisible();

    await page.getByRole('tab', { name: 'Map' }).click();
    await expect(page.locator('.map-canvas')).toBeVisible();
    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });
};

test.describe('Quest graph ancestor highlighting', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('highlights multi-hop ancestors when toggled', async ({ page }) => {
        await loadQuestGraphMap(page);

        const path = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) return null;

            const parents = new Map<string, string[]>();
            cy.edges().forEach((edge) => {
                const source = edge.source()?.id?.();
                const target = edge.target()?.id?.();
                if (!source || !target) return;

                const list = parents.get(target) ?? [];
                list.push(source);
                parents.set(target, list);
            });

            const nodes = cy.nodes().toArray();
            return nodes.reduce<{
                targetId: string;
                parentId: string;
                grandparentId: string;
            } | null>((acc, node) => {
                if (acc) return acc;

                const id = node.id();
                const nodeParents = parents.get(id) ?? [];
                for (const parent of nodeParents) {
                    const grandParents = parents.get(parent) ?? [];
                    if (grandParents.length > 0) {
                        return {
                            targetId: id,
                            parentId: parent,
                            grandparentId: grandParents[0],
                        };
                    }
                }

                return acc;
            }, null);
        });

        if (!path) {
            test.skip();
            return;
        }

        const focused = await page.evaluate(({ targetId }) => {
            const node = window.__questGraphCy?.getElementById(targetId);
            if (!node || node.empty()) return false;
            node.trigger('tap');
            return true;
        }, path);

        expect(focused).toBe(true);
        await expect(page.getByTestId('focused-quest-key')).toHaveText(path.targetId);

        const ancestorToggle = page.getByLabel('Highlight all ancestors');
        await expect(ancestorToggle).toBeVisible();

        const beforeAncestorHighlight = await page.evaluate(({ grandparentId }) => {
            const node = window.__questGraphCy?.getElementById(grandparentId);
            return node?.hasClass('highlight-ancestor') ?? false;
        }, path);
        expect(beforeAncestorHighlight).toBe(false);

        const parentHighlighted = await page.evaluate(({ parentId }) => {
            const node = window.__questGraphCy?.getElementById(parentId);
            return node?.hasClass('highlight-parent') ?? false;
        }, path);
        expect(parentHighlighted).toBe(true);

        await ancestorToggle.check();

        await expect
            .poll(
                async () =>
                    page.evaluate(({ grandparentId }) => {
                        const node = window.__questGraphCy?.getElementById(grandparentId);
                        return node?.hasClass('highlight-ancestor') ?? false;
                    }, path),
                { timeout: 5_000 }
            )
            .toBe(true);

        const ancestorEdgeHighlighted = await page.evaluate(({ grandparentId, parentId }) => {
            const edge = window.__questGraphCy?.getElementById(`${grandparentId}->${parentId}`);
            return edge?.hasClass('highlighted-ancestor') ?? false;
        }, path);
        expect(ancestorEdgeHighlighted).toBe(true);
    });
});
