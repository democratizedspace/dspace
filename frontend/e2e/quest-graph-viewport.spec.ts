import { expect, test, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            zoom: () => number;
            pan: () => { x: number; y: number };
            nodes: () => { length: number };
            center: (eles?: unknown) => void;
            fit: (eles?: unknown, padding?: number) => void;
        };
    }
}

const openQuestMap = async (page: Page) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
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

    await page.waitForFunction(
        () => {
            const canvas = document.querySelector('.map-canvas');
            return canvas && canvas.children.length > 0;
        },
        { timeout: 10000 }
    );

    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10000 });
};

test.describe('Quest graph viewport behavior', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('preserves pan and zoom when toggling unreachable nodes', async ({ page }) => {
        await openQuestMap(page);

        const showUnreachableCheckbox = page.getByLabel(/Show unreachable/);
        if (!(await showUnreachableCheckbox.isEnabled())) {
            test.skip();
        }

        const initialState = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) throw new Error('Cytoscape instance not available');
            const currentZoom = cy.zoom();
            cy.zoom(currentZoom * 1.25);
            const currentPan = cy.pan();
            cy.pan({ x: currentPan.x + 80, y: currentPan.y + 60 });
            return {
                zoom: cy.zoom(),
                pan: cy.pan(),
                nodes: cy.nodes().length,
            };
        });

        await showUnreachableCheckbox.check();

        await page.waitForFunction(
            (expectedNodes) => {
                const cy = window.__questGraphCy;
                return (cy?.nodes().length ?? 0) !== expectedNodes;
            },
            initialState.nodes,
            { timeout: 5000 }
        );

        const postToggleState = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) throw new Error('Cytoscape instance not available');
            return { zoom: cy.zoom(), pan: cy.pan() };
        });

        expect(Math.abs(postToggleState.zoom - initialState.zoom)).toBeLessThan(0.01);
        expect(Math.abs(postToggleState.pan.x - initialState.pan.x)).toBeLessThan(2);
        expect(Math.abs(postToggleState.pan.y - initialState.pan.y)).toBeLessThan(2);
    });

    test('fit graph button updates zoom level', async ({ page }) => {
        await openQuestMap(page);

        const fitButton = page.getByRole('button', { name: 'Fit graph' });
        await expect(fitButton).toBeVisible();

        const zoomBeforeFit = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) throw new Error('Cytoscape instance not available');
            cy.zoom(1.6);
            return cy.zoom();
        });

        await fitButton.click();

        await page.waitForFunction(
            (previousZoom) => {
                const cy = window.__questGraphCy;
                return cy ? Math.abs(cy.zoom() - previousZoom) > 0.01 : false;
            },
            zoomBeforeFit,
            { timeout: 5000 }
        );

        const zoomAfterFit = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) throw new Error('Cytoscape instance not available');
            return cy.zoom();
        });

        expect(zoomAfterFit).not.toBeCloseTo(zoomBeforeFit, 2);
    });
});
