import { test, expect } from '@playwright/test';
import { clearUserData, enableQuestDependencyMap, waitForHydration } from './test-helpers';

// Tolerance for scrollWidth comparison (1px for rounding)
const OVERFLOW_TOLERANCE = 1;

test.describe('Quests page horizontal overflow regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should not create document-level horizontal overflow at wide viewport', async ({
        page,
    }) => {
        await enableQuestDependencyMap(page);
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
        await enableQuestDependencyMap(page);
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
        await enableQuestDependencyMap(page);
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
        await enableQuestDependencyMap(page);
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
