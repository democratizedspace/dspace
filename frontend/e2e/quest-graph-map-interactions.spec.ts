import { expect, test, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

type ViewState = {
    pan: { x: number; y: number };
    zoom: number;
};

declare global {
    interface Window {
        __questGraphCy?: {
            nodes: () => { length: number };
            pan: (value?: { x: number; y: number }) => { x: number; y: number };
            zoom: (value?: number) => number;
            one: (event: string, handler: () => void) => void;
        };
    }
}

const VIEW_TOLERANCE = {
    zoom: 0.01,
    pan: 2,
};

async function waitForMapReady(page: Page) {
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
            return window.__questGraphCy != null && window.__questGraphCy.nodes().length > 0;
        },
        { timeout: 10000 }
    );
}

async function waitForNextLayout(page: Page) {
    await page.evaluate(
        () =>
            new Promise<void>((resolve) => {
                const cy = window.__questGraphCy;
                if (!cy) {
                    resolve();
                    return;
                }
                let resolved = false;
                const timeoutId = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }, 2000);
                cy.one('layoutstop', () => {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(timeoutId);
                    resolve();
                });
            })
    );
}

async function getViewState(page: Page): Promise<ViewState | null> {
    return page.evaluate(() => {
        const cy = window.__questGraphCy;
        if (!cy) return null;
        return {
            pan: cy.pan(),
            zoom: cy.zoom(),
        };
    });
}

async function setCustomView(page: Page) {
    await page.evaluate(() => {
        const cy = window.__questGraphCy;
        if (!cy) return;
        const currentPan = cy.pan();
        cy.zoom(cy.zoom() * 1.35);
        cy.pan({ x: currentPan.x + 140, y: currentPan.y + 90 });
    });
}

function expectViewNear(actual: ViewState | null, expected: ViewState | null, message: string) {
    if (!actual) {
        throw new Error(`${message} view should be available`);
    }
    if (!expected) {
        throw new Error('expected view should be available');
    }
    const zoomDelta = Math.abs(actual.zoom - expected.zoom);
    const panDeltaX = Math.abs(actual.pan.x - expected.pan.x);
    const panDeltaY = Math.abs(actual.pan.y - expected.pan.y);

    expect(zoomDelta, `${message} zoom delta`).toBeLessThanOrEqual(VIEW_TOLERANCE.zoom);
    expect(panDeltaX, `${message} pan x delta`).toBeLessThanOrEqual(VIEW_TOLERANCE.pan);
    expect(panDeltaY, `${message} pan y delta`).toBeLessThanOrEqual(VIEW_TOLERANCE.pan);
}

test.describe('Quest graph map interactions', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('preserves viewport while toggling map filters', async ({ page }) => {
        await waitForMapReady(page);
        await setCustomView(page);

        const initialView = await getViewState(page);
        expect(initialView, 'initial view should be captured').not.toBeNull();

        const showUnreachableToggle = page.getByLabel(/Show unreachable/);
        if (!(await showUnreachableToggle.isEnabled())) {
            test.skip('No unreachable nodes to toggle');
        }

        const layoutAfterShow = waitForNextLayout(page);
        await showUnreachableToggle.check();
        await layoutAfterShow;
        expectViewNear(await getViewState(page), initialView, 'show unreachable on');

        const layoutAfterHide = waitForNextLayout(page);
        await showUnreachableToggle.uncheck();
        await layoutAfterHide;
        expectViewNear(await getViewState(page), initialView, 'show unreachable off');

        const multiParentToggle = page.getByLabel(/Highlight multi-parent quests/);
        await multiParentToggle.uncheck();
        expectViewNear(await getViewState(page), initialView, 'highlight multi-parent off');

        await multiParentToggle.check();
        expectViewNear(await getViewState(page), initialView, 'highlight multi-parent on');
    });

    test('fit graph button adjusts zoom level', async ({ page }) => {
        await waitForMapReady(page);
        await setCustomView(page);

        const zoomBefore = await getViewState(page);
        expect(zoomBefore, 'initial zoom should be captured').not.toBeNull();

        const fitButton = page.getByTestId('fit-graph-button');
        await expect(fitButton).toBeEnabled();
        await fitButton.click();
        await page.waitForTimeout(150);

        const zoomAfter = await getViewState(page);
        expect(zoomAfter, 'zoom after fit should be captured').not.toBeNull();

        expect(
            Math.abs(zoomAfter.zoom - zoomBefore.zoom),
            'fit graph should change zoom level'
        ).toBeGreaterThan(0.05);
    });
});
