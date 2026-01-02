import { expect, test, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            getElementById: (id: string) => {
                emit: (event: string) => void;
                hasClass: (name: string) => boolean;
                empty: () => boolean;
            };
            nodes: (selector?: string) => {
                first: () => { id: () => string; empty: () => boolean };
            };
            edges: (
                selector?: string
            ) => {
                length: number;
                forEach: (
                    fn: (edge: {
                        source: () => { id: () => string | undefined } | undefined;
                        target: () => { id: () => string | undefined } | undefined;
                    }) => void
                ) => void;
            };
        };
    }
}

type ChainFixture = { root: string; middle: string; leaf: string };

const loadQuestGraphMap = async (page: Page) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('/quests');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);

    const visualizer = page.locator('.visualizer');
    await visualizer.scrollIntoViewIfNeeded();
    await expect(visualizer).toBeVisible();

    const mapTab = page.getByRole('tab', { name: 'Map' });
    await mapTab.click();

    const mapCanvas = page.locator('.map-canvas');
    await expect(mapCanvas).toBeVisible();

    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });
};

const findAncestorFixture = async (page: Page): Promise<ChainFixture | null> => {
    return page.evaluate(() => {
        const cy = window.__questGraphCy;
        if (!cy) return null;

        const rootNode = cy.nodes('.root').first();
        if (!rootNode || rootNode.empty()) return null;

        const adjacency = new Map<string, string[]>();
        cy.edges().forEach((edge) => {
            const source = edge.source()?.id?.();
            const target = edge.target()?.id?.();
            if (!source || !target) return;
            const list = adjacency.get(source) ?? [];
            list.push(target);
            adjacency.set(source, list);
        });

        const queue: Array<{ key: string; path: string[] }> = [
            { key: rootNode.id(), path: [rootNode.id()] },
        ];
        const visited = new Set<string>([rootNode.id()]);

        while (queue.length) {
            const current = queue.shift();
            if (!current) continue;
            const children = [...(adjacency.get(current.key) ?? [])].sort();
            for (const child of children) {
                const nextPath = [...current.path, child];
                if (nextPath.length >= 3) {
                    const middle = nextPath[nextPath.length - 2];
                    const leaf = nextPath[nextPath.length - 1];
                    return { root: rootNode.id(), middle, leaf };
                }

                if (!visited.has(child)) {
                    visited.add(child);
                    queue.push({ key: child, path: nextPath });
                }
            }
        }

        return null;
    });
};

const focusNode = async (page: Page, key: string) => {
    await page.evaluate(({ key: target }) => {
        const cy = window.__questGraphCy;
        const node = cy?.getElementById(target);
        if (node && !node.empty()) {
            node.emit('tap');
        }
    }, { key });
};

test.describe('Quest graph ancestor and descendant highlights', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('highlights multi-hop ancestors and descendants', async ({ page }) => {
        await loadQuestGraphMap(page);

        const fixture = await findAncestorFixture(page);
        if (!fixture) {
            test.skip();
            return;
        }

        const ancestorsToggle = page.getByLabel('Highlight all ancestors');
        const descendantsToggle = page.getByLabel('Highlight all descendants');

        await ancestorsToggle.check();

        await focusNode(page, fixture.leaf);

        await page.waitForFunction(
            ({ root, middle }) => {
                const cy = window.__questGraphCy;
                const rootNode = cy?.getElementById(root);
                const middleNode = cy?.getElementById(middle);
                return Boolean(
                    rootNode?.hasClass('highlight-ancestor') &&
                        middleNode?.hasClass('highlight-ancestor')
                );
            },
            fixture,
            { timeout: 5000 }
        );

        const ancestorEdges = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            return cy?.edges('.ancestor-path').length ?? 0;
        });

        expect(ancestorEdges).toBeGreaterThanOrEqual(2);

        await descendantsToggle.check();

        await focusNode(page, fixture.root);

        await page.waitForFunction(
            ({ leaf }) => {
                const cy = window.__questGraphCy;
                const leafNode = cy?.getElementById(leaf);
                return Boolean(leafNode?.hasClass('highlight-descendant'));
            },
            fixture,
            { timeout: 5000 }
        );

        const descendantEdges = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            return cy?.edges('.descendant-path').length ?? 0;
        });

        expect(descendantEdges).toBeGreaterThanOrEqual(2);
    });
});
