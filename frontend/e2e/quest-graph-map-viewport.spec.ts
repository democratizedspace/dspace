import { test, expect, type Page } from '@playwright/test';
import { clearUserData, enableQuestGraphVisualizer, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: {
            zoom: (value?: number) => number;
            pan: (value?: { x: number; y: number }) => { x: number; y: number };
            once: (event: string, handler: () => void) => void;
            center: (eles?: unknown) => void;
        };
    }
}

type ViewportState = { zoom: number; pan: { x: number; y: number } };

const waitForLayoutStop = async (page: Page) => {
    await page.evaluate(
        () =>
            new Promise<void>((resolve) => {
                const cy = window.__questGraphCy;
                if (!cy) {
                    resolve();
                    return;
                }

                let resolved = false;
                const finish = () => {
                    if (resolved) return;
                    resolved = true;
                    resolve();
                };

                cy.once('layoutstop', finish);
                cy.once('layoutready', finish);
                setTimeout(finish, 2000);
            })
    );
};

const loadQuestMap = async (page: Page) => {
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

    await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });
};

const setViewport = async (page: Page): Promise<ViewportState> => {
    return page.evaluate(() => {
        const cy = window.__questGraphCy;
        if (!cy) {
            return { zoom: 1, pan: { x: 0, y: 0 } };
        }

        cy.zoom(1.6);
        cy.pan({ x: 160, y: 140 });

        return { zoom: cy.zoom(), pan: cy.pan() };
    });
};

const getViewport = async (page: Page): Promise<ViewportState> => {
    return page.evaluate(() => {
        const cy = window.__questGraphCy;
        return {
            zoom: cy?.zoom() ?? 1,
            pan: cy?.pan() ?? { x: 0, y: 0 },
        };
    });
};

const expectViewportClose = (actual: ViewportState, expected: ViewportState) => {
    expect(Math.abs(actual.zoom - expected.zoom)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(actual.pan.x - expected.pan.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(actual.pan.y - expected.pan.y)).toBeLessThanOrEqual(2);
};

test.describe('Quest graph map viewport controls', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await enableQuestGraphVisualizer(page);
    });

    test('keeps pan and zoom when toggling unreachable nodes', async ({ page }) => {
        await loadQuestMap(page);

        const showUnreachableCheckbox = page.getByLabel(/Show unreachable/);
        const initialViewport = await setViewport(page);

        if (!(await showUnreachableCheckbox.isEnabled())) {
            await expect(showUnreachableCheckbox).toBeDisabled();
            await page.getByRole('tab', { name: 'Diagnostics' }).click();
            await page.getByRole('tab', { name: 'Map' }).click();
            await waitForLayoutStop(page);
            const afterTabSwitch = await getViewport(page);
            expectViewportClose(afterTabSwitch, initialViewport);
            return;
        }

        await showUnreachableCheckbox.check();
        await waitForLayoutStop(page);
        const afterEnable = await getViewport(page);

        await showUnreachableCheckbox.uncheck();
        await waitForLayoutStop(page);
        const afterDisable = await getViewport(page);

        expectViewportClose(afterEnable, initialViewport);
        expectViewportClose(afterDisable, initialViewport);
    });

    test('fit graph adjusts zoom level', async ({ page }) => {
        await loadQuestMap(page);

        const startingZoom = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            if (!cy) return null;
            cy.zoom(2.2);
            cy.pan({ x: 240, y: 180 });
            return cy.zoom();
        });

        expect(startingZoom).not.toBeNull();

        const fitButton = page.getByRole('button', { name: 'Fit graph' });
        await fitButton.click();
        await waitForLayoutStop(page);

        const zoomAfterFit = await page.evaluate(() => window.__questGraphCy?.zoom() ?? null);
        expect(zoomAfterFit).not.toBeNull();

        if (zoomAfterFit !== null && startingZoom !== null) {
            expect(Math.abs(zoomAfterFit - startingZoom)).toBeGreaterThan(0.05);
        }
    });

    test('centers on the focused node when requested', async ({ page }) => {
        await loadQuestMap(page);
        await waitForLayoutStop(page);

        const setupState = await page.evaluate(() => {
            const cy = window.__questGraphCy;
            const root = cy?.nodes('.root').first();
            if (!cy || !root || root.empty()) return null;

            cy.zoom(1.8);
            cy.pan({ x: 240, y: 210 });

            return {
                rootId: root.id(),
                beforePan: cy.pan(),
            };
        });

        expect(setupState).not.toBeNull();
        if (!setupState) return;

        const centerButton = page.getByRole('button', { name: 'Center on focused' });
        await centerButton.click();

        const centeredState = await page.evaluate(({ rootId }) => {
            const cy = window.__questGraphCy;
            const node = cy?.getElementById(rootId);
            if (!cy || !node || node.empty()) return null;

            const renderedPosition = node.renderedPosition();
            return {
                pan: cy.pan(),
                renderedPosition,
                viewportCenter: { x: cy.width() / 2, y: cy.height() / 2 },
            };
        }, setupState);

        expect(centeredState).not.toBeNull();
        if (!centeredState) return;

        expect(centeredState.pan).not.toEqual(setupState.beforePan);
        expect(
            Math.abs(centeredState.renderedPosition.x - centeredState.viewportCenter.x)
        ).toBeLessThanOrEqual(8);
        expect(
            Math.abs(centeredState.renderedPosition.y - centeredState.viewportCenter.y)
        ).toBeLessThanOrEqual(8);
    });
});
