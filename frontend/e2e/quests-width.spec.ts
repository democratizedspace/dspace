import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

// Tolerance for scrollWidth comparison (1px for rounding)
const OVERFLOW_TOLERANCE = 1;

test.describe('Quests page horizontal overflow regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
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

        // Toggle "Show unreachable quests" checkbox
        const showUnreachableCheckbox = page.getByLabel('Show unreachable quests');
        await expect(showUnreachableCheckbox).toBeVisible();
        await showUnreachableCheckbox.check();

        // Wait for stable state after toggle
        await page.waitForFunction(() => document.readyState === 'complete');

        // Check for overflow
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
});
