import { test, expect, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            getElementById: (id: string) => {
                hasClass: (name: string) => boolean;
            };
        };
    }
}

const ROOT_KEY = 'welcome/howtodoquests.json';
const PARENT_KEY = 'fixtures/parent.json';
const CHILD_KEY = 'fixtures/child.json';
const GRANDCHILD_KEY = 'fixtures/grandchild.json';

const loadFixtureGraph = async (page: Page) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/quests/fixtures/ancestor-highlights');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);

    const visualizer = page.locator('.visualizer');
    await visualizer.scrollIntoViewIfNeeded();
    await expect(visualizer).toBeVisible();

    const mapTab = page.getByRole('tab', { name: 'Map' });
    await mapTab.click();

    const mapPanel = page.getByTestId('quest-graph-panel-map');
    await expect(mapPanel).toBeVisible();

    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });
};

const focusQuest = async (page: Page, questTitle: string, questKey: string) => {
    await page.getByRole('button', { name: 'Search' }).click();
    const searchInput = page.getByPlaceholder('Jump to quest');
    await searchInput.fill(questTitle);
    await page.getByRole('button', { name: new RegExp(questTitle, 'i') }).click();
    await expect(page.getByTestId('focused-quest-key')).toHaveText(questKey);
};

const hasClass = async (page: Page, key: string, className: string) => {
    return page.evaluate(
        ([nodeKey, classToCheck]) => {
            const cy = window.__questGraphCy;
            const node = cy?.getElementById(nodeKey);
            return node?.hasClass(classToCheck) ?? false;
        },
        [key, className]
    );
};

test.describe('Quest graph ancestor and descendant highlighting', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('ancestor toggle highlights multi-hop parents without needing direct neighbors', async ({
        page,
    }) => {
        await loadFixtureGraph(page);
        await focusQuest(page, 'Fixture Grandchild Quest', GRANDCHILD_KEY);

        await expect.poll(() => hasClass(page, CHILD_KEY, 'highlight-parent')).toBe(true);

        await page.getByLabel('Highlight all ancestors').check();
        await expect.poll(() => hasClass(page, PARENT_KEY, 'highlight-ancestor')).toBe(true);
        await expect.poll(() => hasClass(page, ROOT_KEY, 'highlight-ancestor')).toBe(true);

        await page.getByLabel('Highlight direct neighbors').uncheck();
        await expect.poll(() => hasClass(page, CHILD_KEY, 'highlight-parent')).toBe(false);

        const ancestorStates = await page.evaluate(
            ([parentKey, rootKey]) => {
                const cy = window.__questGraphCy;
                const parent = cy?.getElementById(parentKey);
                const root = cy?.getElementById(rootKey);
                return {
                    parentAncestor: parent?.hasClass('highlight-ancestor') ?? false,
                    rootAncestor: root?.hasClass('highlight-ancestor') ?? false,
                };
            },
            [PARENT_KEY, ROOT_KEY]
        );

        expect(ancestorStates.parentAncestor).toBe(true);
        expect(ancestorStates.rootAncestor).toBe(true);
    });

    test('descendant toggle highlights entire downstream chain', async ({ page }) => {
        await loadFixtureGraph(page);
        await expect(page.getByTestId('focused-quest-key')).toHaveText(ROOT_KEY);

        await page.getByLabel('Highlight all descendants').check();

        await expect.poll(() => hasClass(page, PARENT_KEY, 'highlight-descendant')).toBe(true);
        await expect.poll(() => hasClass(page, CHILD_KEY, 'highlight-descendant')).toBe(true);
        await expect.poll(() => hasClass(page, GRANDCHILD_KEY, 'highlight-descendant')).toBe(true);
    });
});
