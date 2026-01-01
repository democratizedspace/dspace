import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            zoom: () => number;
            pan: () => { x: number; y: number };
            nodes: () => { length: number };
            getElementById: (id: string) => { empty: () => boolean };
        };
    }
}

const withinTolerance = (a: number, b: number, tolerance: number) =>
    Math.abs(a - b) <= tolerance;

async function openMap(page: Page) {
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

    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10000 });
    await page.waitForTimeout(200);
}

type ViewState = { pan: { x: number; y: number }; zoom: number };

async function getViewState(page: Page): Promise<ViewState> {
    const state = await page.evaluate(() => {
        const cy = window.__questGraphCy;
        if (!cy) return null;
        return { pan: cy.pan(), zoom: cy.zoom() };
    });

    if (!state) {
        throw new Error('Cytoscape instance unavailable');
    }

    return state;
}

test.describe('Quest graph map viewport controls', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('preserves pan/zoom when toggling map options', async ({ page }) => {
        await openMap(page);

        await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) return;
            cy.zoom(1.55);
            cy.pan({ x: 180, y: -140 });
        });

        const initialView = await getViewState(page);

        const highlightToggle = page.getByLabel(/Highlight multi-parent quests/);
        await highlightToggle.click();
        await page.waitForTimeout(150);

        const afterHighlightView = await getViewState(page);

        expect(
            withinTolerance(afterHighlightView.zoom, initialView.zoom, 0.02),
            'Zoom changed after toggling highlight'
        ).toBe(true);
        expect(
            withinTolerance(afterHighlightView.pan.x, initialView.pan.x, 6) &&
                withinTolerance(afterHighlightView.pan.y, initialView.pan.y, 6),
            'Pan changed after toggling highlight'
        ).toBe(true);

        const showUnreachableToggle = page.getByLabel(/Show unreachable/);
        const canToggleUnreachable = await showUnreachableToggle.isEnabled();

        if (!canToggleUnreachable) {
            return;
        }

        const initialNodeCount = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            return cy?.nodes().length ?? 0;
        });

        await showUnreachableToggle.check();
        await page.waitForFunction(
            (expected) => {
                const cy = window.__questGraphCy;
                return (cy?.nodes().length ?? 0) !== expected;
            },
            initialNodeCount,
            { timeout: 7000 }
        );
        await page.waitForTimeout(200);

        const afterToggleOnView = await getViewState(page);

        expect(
            withinTolerance(afterToggleOnView.zoom, initialView.zoom, 0.02),
            'Zoom changed after enabling unreachable'
        ).toBe(true);
        expect(
            withinTolerance(afterToggleOnView.pan.x, initialView.pan.x, 6) &&
                withinTolerance(afterToggleOnView.pan.y, initialView.pan.y, 6),
            'Pan changed after enabling unreachable'
        ).toBe(true);

        await showUnreachableToggle.uncheck();
        await page.waitForFunction(
            (expected) => {
                const cy = window.__questGraphCy;
                return (cy?.nodes().length ?? 0) === expected;
            },
            initialNodeCount,
            { timeout: 7000 }
        );
        await page.waitForTimeout(200);

        const afterToggleOffView = await getViewState(page);

        expect(
            withinTolerance(afterToggleOffView.zoom, initialView.zoom, 0.02),
            'Zoom changed after disabling unreachable'
        ).toBe(true);
        expect(
            withinTolerance(afterToggleOffView.pan.x, initialView.pan.x, 6) &&
                withinTolerance(afterToggleOffView.pan.y, initialView.pan.y, 6),
            'Pan changed after disabling unreachable'
        ).toBe(true);
    });

    test('fits graph when requested', async ({ page }) => {
        await openMap(page);

        await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) return;
            cy.zoom(2.2);
            cy.pan({ x: 220, y: -180 });
        });

        const beforeFit = await getViewState(page);

        const fitButton = page.getByRole('button', { name: 'Fit graph' });
        await fitButton.click();

        await page.waitForFunction(
            (previousZoom) => {
                const cy = window.__questGraphCy;
                if (!cy) return false;
                return Math.abs(cy.zoom() - previousZoom) > 0.05;
            },
            beforeFit.zoom,
            { timeout: 7000 }
        );

        const afterFit = await getViewState(page);

        expect(afterFit.zoom).not.toBeCloseTo(beforeFit.zoom, 1);
    });
});
