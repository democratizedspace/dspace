import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

// Extend Window interface for test-only exposed Cytoscape instance
declare global {
    interface Window {
        __questGraphCy?: {
            nodes: () => { length: number };
        };
    }
}

test.describe('Quest graph "Show unreachable" toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should show unreachable count and disable when no unreachable nodes exist', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll visualizer into view
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        // Click on Map tab
        const mapTab = page.getByRole('tab', { name: 'Map' });
        await mapTab.click();

        // Wait for map canvas to be visible
        const mapCanvas = page.locator('.map-canvas');
        await expect(mapCanvas).toBeVisible();

        // Wait for map to initialize (check for Cytoscape container)
        await page.waitForFunction(
            () => {
                const canvas = document.querySelector('.map-canvas');
                return canvas && canvas.children.length > 0;
            },
            { timeout: 10000 }
        );

        // Check the unreachable checkbox label and state
        const showUnreachableLabel = page.locator('label:has-text("Show unreachable")');
        await expect(showUnreachableLabel).toBeVisible();

        // Check that label shows count format
        const labelText = await showUnreachableLabel.textContent();
        expect(labelText).toMatch(/Show unreachable \(\d+\)/);

        // Get the actual unreachable count from the label
        const countMatch = labelText?.match(/Show unreachable \((\d+)\)/);
        const unreachableCount = countMatch ? parseInt(countMatch[1], 10) : -1;

        // Get the checkbox element
        const showUnreachableCheckbox = page.getByLabel(/Show unreachable/);

        if (unreachableCount === 0) {
            // When no unreachable nodes, checkbox should be disabled
            await expect(showUnreachableCheckbox).toBeDisabled();

            // Check for hint text
            const hintText = page.locator('.hint:has-text("No unreachable quests detected")');
            await expect(hintText).toBeVisible();

            // Label should have disabled styling
            await expect(showUnreachableLabel).toHaveClass(/disabled/);
        } else {
            // When unreachable nodes exist, checkbox should be enabled
            await expect(showUnreachableCheckbox).toBeEnabled();

            // No hint text should be visible
            const hintText = page.locator('.hint:has-text("No unreachable quests detected")');
            await expect(hintText).not.toBeVisible();
        }
    });

    test('should toggle node visibility when unreachable nodes exist', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        // Scroll visualizer into view
        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        // Click on Map tab
        const mapTab = page.getByRole('tab', { name: 'Map' });
        await mapTab.click();

        // Wait for map canvas to be visible
        const mapCanvas = page.locator('.map-canvas');
        await expect(mapCanvas).toBeVisible();

        // Wait for Cytoscape instance to be available
        await page.waitForFunction(
            () => {
                return window.__questGraphCy != null;
            },
            { timeout: 10000 }
        );

        // Check if unreachable toggle is enabled (meaning there are unreachable nodes)
        const showUnreachableCheckbox = page.getByLabel(/Show unreachable/);
        const isEnabled = await showUnreachableCheckbox.isEnabled();

        if (!isEnabled) {
            test.skip();
            return;
        }

        // Get initial node count using real Cytoscape API
        const initialNodeCount = await page.evaluate(() => {
            return window.__questGraphCy?.nodes().length ?? 0;
        });

        // Toggle the checkbox ON (to show unreachable)
        await showUnreachableCheckbox.check();

        // Wait for graph to update by checking real node count changes
        await page.waitForFunction(
            (initial) => {
                const current = window.__questGraphCy?.nodes().length ?? 0;
                return current !== initial;
            },
            initialNodeCount,
            { timeout: 5000 }
        );

        const nodeCountAfterToggleOn = await page.evaluate(() => {
            return window.__questGraphCy?.nodes().length ?? 0;
        });

        // Toggle the checkbox OFF (to hide unreachable)
        await showUnreachableCheckbox.uncheck();

        // Wait for graph to revert to initial count
        await page.waitForFunction(
            (expected) => {
                const current = window.__questGraphCy?.nodes().length ?? 0;
                return current === expected;
            },
            initialNodeCount,
            { timeout: 5000 }
        );

        const nodeCountAfterToggleOff = await page.evaluate(() => {
            return window.__questGraphCy?.nodes().length ?? 0;
        });

        // Verify that toggling actually changed the node count
        expect(nodeCountAfterToggleOn).toBeGreaterThan(initialNodeCount);
        expect(nodeCountAfterToggleOff).toBe(initialNodeCount);
    });
});
