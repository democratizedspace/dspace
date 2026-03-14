import { test, expect } from '@playwright/test';
import {
    clearUserData,
    enableQuestGraphVisualizer,
    seedCustomQuest,
    waitForHydration,
} from './test-helpers';

// Tolerance for scrollWidth comparison (1px for rounding)
const OVERFLOW_TOLERANCE = 1;

test.describe('Quests page horizontal overflow regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await enableQuestGraphVisualizer(page);
    });

    test('should not create document-level horizontal overflow at wide viewport', async ({
        page,
    }) => {
        // Set wide viewport to reproduce the overflow issue
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll the visualizer into view to trigger client:visible hydration
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();

        // Wait for visualizer to be visible and stable
        await expect(visualizer).toBeVisible();

        // Wait for stable layout by checking no pending reflows
        await page.waitForFunction(() => {
            return document.readyState === 'complete';
        });

        // Assert no document-level horizontal overflow
        const hasOverflow = await page.evaluate((tolerance) => {
            const docEl = document.documentElement;
            const body = document.body;
            const docOverflow = docEl.scrollWidth > docEl.clientWidth + tolerance;
            const bodyOverflow = body.scrollWidth > docEl.clientWidth + tolerance;
            return { docOverflow, bodyOverflow };
        }, OVERFLOW_TOLERANCE);

        expect(hasOverflow.docOverflow).toBe(false);
        expect(hasOverflow.bodyOverflow).toBe(false);
    });

    test('should not overflow after clicking Map tab', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll visualizer into view to trigger hydration
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        // Click on the Map tab
        const mapTab = page.getByRole('tab', { name: 'Map' });
        await expect(mapTab).toBeVisible();
        await mapTab.click();

        // Wait for Cytoscape map canvas to be visible
        const mapCanvas = page.locator('.map-canvas');
        await expect(mapCanvas).toBeVisible();

        // Re-check for overflow after Map tab is active
        const hasOverflow = await page.evaluate((tolerance) => {
            const docEl = document.documentElement;
            const body = document.body;
            const docOverflow = docEl.scrollWidth > docEl.clientWidth + tolerance;
            const bodyOverflow = body.scrollWidth > docEl.clientWidth + tolerance;
            return { docOverflow, bodyOverflow };
        }, OVERFLOW_TOLERANCE);

        expect(hasOverflow.docOverflow).toBe(false);
        expect(hasOverflow.bodyOverflow).toBe(false);
    });

    test('should not overflow after toggling Show unreachable', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll visualizer into view
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        // Click on Map tab first
        const mapTab = page.getByRole('tab', { name: 'Map' });
        await mapTab.click();

        // Wait for map canvas to be visible
        const mapCanvas = page.locator('.map-canvas');
        await expect(mapCanvas).toBeVisible();

        // Check if the "Show unreachable" checkbox is enabled
        const showUnreachableCheckbox = page.getByLabel(/Show unreachable/);
        await expect(showUnreachableCheckbox).toBeVisible();

        const isEnabled = await showUnreachableCheckbox.isEnabled();

        // Only toggle if the checkbox is enabled (i.e., there are unreachable nodes)
        if (isEnabled) {
            await showUnreachableCheckbox.check();

            // Wait for stable state after toggle
            await page.waitForFunction(() => document.readyState === 'complete');
        }

        // Check for overflow (regardless of whether we toggled)
        const hasOverflow = await page.evaluate((tolerance) => {
            const docEl = document.documentElement;
            const body = document.body;
            const docOverflow = docEl.scrollWidth > docEl.clientWidth + tolerance;
            const bodyOverflow = body.scrollWidth > docEl.clientWidth + tolerance;
            return { docOverflow, bodyOverflow };
        }, OVERFLOW_TOLERANCE);

        expect(hasOverflow.docOverflow).toBe(false);
        expect(hasOverflow.bodyOverflow).toBe(false);
    });

    test('shelf cards should scroll horizontally within the container', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll visualizer into view
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        // Verify the .cards containers have overflow-x: auto style
        const cardsContainers = page.locator('.cards');
        const count = await cardsContainers.count();
        expect(count).toBeGreaterThan(0);

        // Check that at least one cards container has proper overflow styling
        const firstCards = cardsContainers.first();
        const overflowStyle = await firstCards.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return {
                overflowX: style.overflowX,
                maxWidth: style.maxWidth,
            };
        });

        expect(overflowStyle.overflowX).toBe('auto');
    });

    test('cards should have readable minimum width', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll visualizer into view
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        // Get card widths - scoped to visualizer shelf cards specifically
        const cards = page.locator('.visualizer .cards .card');
        const cardCount = await cards.count();
        expect(cardCount).toBeGreaterThan(0);

        // Check first 3 visualizer shelf cards have minimum readable width (>= 280px)
        const MINIMUM_CARD_WIDTH = 280;
        const cardWidths = await page.evaluate(() => {
            const cardElements = document.querySelectorAll('.visualizer .cards .card');
            return Array.from(cardElements)
                .slice(0, 3)
                .map((el) => el.getBoundingClientRect().width);
        });

        for (const width of cardWidths) {
            expect(width).toBeGreaterThanOrEqual(MINIMUM_CARD_WIDTH);
        }
    });

    test('quest tile text column should have readable minimum width', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Wait for quest tiles to be visible (does not depend on QuestGraphVisualizer)
        const questTiles = page.locator('[data-testid="quest-tile"]');
        await expect(questTiles.first()).toBeVisible();

        // Get text column widths for the first quest tile
        const MINIMUM_TEXT_WIDTH = 180;
        const textColumnWidths = await page.evaluate(() => {
            const textElements = document.querySelectorAll('[data-testid="quest-tile-text"]');
            return Array.from(textElements)
                .slice(0, 3)
                .map((el) => el.getBoundingClientRect().width);
        });

        expect(textColumnWidths.length).toBeGreaterThan(0);

        for (const width of textColumnWidths) {
            expect(width).toBeGreaterThanOrEqual(MINIMUM_TEXT_WIDTH);
        }

        // Also verify no document-level overflow
        const hasOverflow = await page.evaluate((tolerance) => {
            const docEl = document.documentElement;
            return docEl.scrollWidth > docEl.clientWidth + tolerance;
        }, OVERFLOW_TOLERANCE);

        expect(hasOverflow).toBe(false);
    });

    test('quest tiles in the same row should share a uniform height', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/');
        await seedCustomQuest(page, {
            id: 'quest-grid-height-test-a',
            title: 'Quest Height Regression A',
            description: 'Custom quest seeded for first-row height consistency checks.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Start node',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ],
            requiresQuests: [],
        });
        await seedCustomQuest(page, {
            id: 'quest-grid-height-test-b',
            title: 'Quest Height Regression B',
            description:
                'Second custom quest seeded to guarantee more than one first-row tile in tests.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Start node',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const firstTile = page.locator('.quests-grid > a').first();
        await expect(firstTile).toBeVisible();

        const firstRowHeights = await page.evaluate(() => {
            const tiles = Array.from(document.querySelectorAll('.quests-grid > a'));
            if (tiles.length === 0) {
                return [];
            }

            const top = tiles[0].getBoundingClientRect().top;
            return tiles
                .filter((tile) => Math.abs(tile.getBoundingClientRect().top - top) < 1)
                .map((tile) => tile.getBoundingClientRect().height);
        });

        expect(firstRowHeights.length).toBeGreaterThan(1);

        const minHeight = Math.min(...firstRowHeights);
        const maxHeight = Math.max(...firstRowHeights);
        expect(maxHeight - minHeight).toBeLessThanOrEqual(1);
    });

    test('quest tile text column should have comfortable right padding', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Wait for quest tiles to be visible
        const questTiles = page.locator('[data-testid="quest-tile"]');
        await expect(questTiles.first()).toBeVisible();

        // Get padding-right of the first quest tile text container
        const MINIMUM_PADDING_RIGHT = 16;
        const paddingRight = await page.evaluate(() => {
            const textEl = document.querySelector('[data-testid="quest-tile-text"]');
            if (!textEl) return 0;
            return parseFloat(window.getComputedStyle(textEl).paddingRight);
        });

        expect(paddingRight).toBeGreaterThanOrEqual(MINIMUM_PADDING_RIGHT);
    });
});

test.describe('Quests page responsive grid centering', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('centers quest tiles when the final row is not full on wide screens', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/');
        const desktopQuestIds = [
            'quest-grid-centering-a',
            'quest-grid-centering-b',
            'quest-grid-centering-c',
            'quest-grid-centering-d',
            'quest-grid-centering-e',
        ];

        for (const [index, id] of desktopQuestIds.entries()) {
            await seedCustomQuest(page, {
                id,
                title: `Quest Grid Centering ${index + 1}`,
                description:
                    'Quest seeded to force a deterministic partial final row in desktop centering tests.',
                image: '/assets/quests/howtodoquests.jpg',
                npc: '/assets/npc/dChat.jpg',
                start: 'start',
                dialogue: [
                    {
                        id: 'start',
                        text: 'Start node',
                        options: [{ type: 'finish', text: 'Finish' }],
                    },
                ],
                requiresQuests: [],
            });
        }

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const firstTile = page.locator('[data-testid="quests-grid"] > a').first();
        await expect(firstTile).toBeVisible();

        const layout = await page.evaluate(() => {
            const grid = document.querySelector('[data-testid="quests-grid"]');
            const tiles = Array.from(document.querySelectorAll('[data-testid="quests-grid"] > a'));
            if (!grid || tiles.length === 0) {
                return null;
            }

            const tolerance = 1;
            const tops = [
                ...new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top))),
            ];
            const rowSizes = tops.map(
                (top) =>
                    tiles.filter(
                        (tile) => Math.abs(tile.getBoundingClientRect().top - top) <= tolerance
                    ).length
            );

            const firstRowCount = rowSizes[0] ?? 0;
            const lastRowTop = tops[tops.length - 1];
            const lastRowTiles = tiles.filter(
                (tile) => Math.abs(tile.getBoundingClientRect().top - lastRowTop) <= tolerance
            );
            const hasPartialLastRow =
                rowSizes.length > 1 &&
                lastRowTiles.length > 0 &&
                firstRowCount > 0 &&
                lastRowTiles.length < firstRowCount;

            const left = Math.min(...lastRowTiles.map((tile) => tile.getBoundingClientRect().left));
            const right = Math.max(
                ...lastRowTiles.map((tile) => tile.getBoundingClientRect().right)
            );

            const gridRect = grid.getBoundingClientRect();
            const leftSpace = left - gridRect.left;
            const rightSpace = gridRect.right - right;

            return { hasPartialLastRow, leftSpace, rightSpace, rowSizes };
        });

        expect(layout).toBeTruthy();
        expect(layout?.hasPartialLastRow).toBe(true);
        expect(Math.abs((layout?.leftSpace ?? 0) - (layout?.rightSpace ?? 0))).toBeLessThanOrEqual(
            3
        );
    });

    test('keeps one quest tile per row on mobile screens', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });

        await page.goto('/');
        const mobileQuestIds = [
            'quest-grid-mobile-a',
            'quest-grid-mobile-b',
            'quest-grid-mobile-c',
        ];

        for (const [index, id] of mobileQuestIds.entries()) {
            await seedCustomQuest(page, {
                id,
                title: `Quest Grid Mobile ${index + 1}`,
                description:
                    'Quest seeded to guarantee multiple one-card rows in mobile layout tests.',
                image: '/assets/quests/howtodoquests.jpg',
                npc: '/assets/npc/dChat.jpg',
                start: 'start',
                dialogue: [
                    {
                        id: 'start',
                        text: 'Start node',
                        options: [{ type: 'finish', text: 'Finish' }],
                    },
                ],
                requiresQuests: [],
            });
        }

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const firstTile = page.locator('[data-testid="quests-grid"] > a').first();
        await expect(firstTile).toBeVisible();

        const layout = await page.evaluate((tolerance) => {
            const tiles = Array.from(document.querySelectorAll('[data-testid="quests-grid"] > a'));
            if (tiles.length === 0) {
                return null;
            }

            const roundedRows = new Set(
                tiles.map((tile) => Math.round(tile.getBoundingClientRect().top))
            );
            const docEl = document.documentElement;
            const hasHorizontalOverflow = docEl.scrollWidth > docEl.clientWidth + tolerance;

            return {
                tileCount: tiles.length,
                rowCount: roundedRows.size,
                hasHorizontalOverflow,
            };
        }, OVERFLOW_TOLERANCE);

        expect(layout).toBeTruthy();
        expect(layout?.tileCount ?? 0).toBeGreaterThanOrEqual(3);
        expect(layout?.rowCount).toBe(layout?.tileCount);
        expect(layout?.hasHorizontalOverflow).toBe(false);
    });
});
