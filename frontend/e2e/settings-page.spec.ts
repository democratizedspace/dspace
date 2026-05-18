import { test, expect, type Locator, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const RESPONSIVE_VIEWPORTS = [
    { name: 'mobile', width: 375, height: 844, expectedColumns: 1 },
    { name: 'tablet', width: 768, height: 1024, minColumns: 2 },
    { name: 'desktop', width: 1280, height: 900, minColumns: 3 },
] as const;

const cardSelectors = ['.logout-panel', '.panel', '.data-reset', '.legacy-upgrade'];

type LayoutSnapshot = {
    viewportWidth: number;
    contentWidth: number;
    columnCount: number;
    verticalGap: number;
    cards: Array<{
        selector: string;
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    }>;
};

const loadSettings = async (page: Page) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);
};

const getSettingsControls = (page: Page): Locator =>
    page
        .locator('.settings-content')
        .locator(
            [
                'button:not([disabled])',
                'a[href]',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
            ].join(', ')
        )
        .filter({ visible: true });

const collectLayoutSnapshot = async (page: Page): Promise<LayoutSnapshot | null> =>
    page.evaluate((selectors) => {
        const settingsContent = document.querySelector('.settings-content');
        const cards = selectors
            .flatMap((selector) =>
                Array.from(document.querySelectorAll(selector)).map((element) => ({
                    selector,
                    element,
                }))
            )
            .filter(({ element }) => {
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });

        if (!settingsContent || cards.length < selectors.length) {
            return null;
        }

        const contentRect = settingsContent.getBoundingClientRect();
        const styles = getComputedStyle(settingsContent);
        const gridColumns = styles.gridTemplateColumns.split(' ').filter(Boolean);
        const verticalGap = Number.parseFloat(styles.rowGap || styles.gap || '0');

        return {
            viewportWidth: window.innerWidth,
            contentWidth: contentRect.width,
            columnCount: gridColumns.length,
            verticalGap,
            cards: cards.map(({ selector, element }) => {
                const rect = element.getBoundingClientRect();
                return {
                    selector,
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height,
                };
            }),
        };
    }, cardSelectors);

const expectNoCardOverlap = (layout: LayoutSnapshot) => {
    for (let i = 0; i < layout.cards.length; i += 1) {
        for (let j = i + 1; j < layout.cards.length; j += 1) {
            const first = layout.cards[i];
            const second = layout.cards[j];
            const overlapsHorizontally = first.left < second.right && second.left < first.right;
            const overlapsVertically = first.top < second.bottom && second.top < first.bottom;

            expect(
                overlapsHorizontally && overlapsVertically,
                `${first.selector} should not overlap ${second.selector} at ${layout.viewportWidth}px`
            ).toBe(false);
        }
    }
};

const expectReadableSpacing = (layout: LayoutSnapshot) => {
    const minimumGap = Math.min(12, layout.verticalGap || 12);

    for (let i = 0; i < layout.cards.length; i += 1) {
        for (let j = i + 1; j < layout.cards.length; j += 1) {
            const first = layout.cards[i];
            const second = layout.cards[j];
            const sameColumn = Math.abs(first.left - second.left) <= 2;
            const secondBelowFirst = second.top >= first.bottom;
            const firstBelowSecond = first.top >= second.bottom;

            if (sameColumn && secondBelowFirst) {
                expect(
                    second.top - first.bottom,
                    `${second.selector} should keep readable vertical spacing after ${first.selector}`
                ).toBeGreaterThanOrEqual(minimumGap);
            }

            if (sameColumn && firstBelowSecond) {
                expect(
                    first.top - second.bottom,
                    `${first.selector} should keep readable vertical spacing after ${second.selector}`
                ).toBeGreaterThanOrEqual(minimumGap);
            }
        }
    }
};

test.describe('Settings route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads settings page', async ({ page }) => {
        await loadSettings(page);
        await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
        await expect(
            page.getByRole('heading', { level: 2, name: 'Manage your DSPACE session' })
        ).toBeVisible();
        await expect(page.getByRole('heading', { level: 3, name: 'Log out' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
        await expect(page.getByTestId('logout-state')).toHaveText('No saved credentials detected.');
    });

    test('keeps settings layout responsive without card overlap', async ({ page }) => {
        for (const viewport of RESPONSIVE_VIEWPORTS) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await loadSettings(page);

            const layout = await collectLayoutSnapshot(page);

            expect(
                layout,
                `${viewport.name} layout should render all settings cards`
            ).not.toBeNull();
            expect(layout?.contentWidth ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
                viewport.width
            );

            if (viewport.expectedColumns) {
                expect(layout?.columnCount, `${viewport.name} should use one column`).toBe(
                    viewport.expectedColumns
                );
            }

            if (viewport.minColumns) {
                expect(
                    layout?.columnCount,
                    `${viewport.name} should preserve grouped multi-column layout`
                ).toBeGreaterThanOrEqual(viewport.minColumns);
            }

            expectNoCardOverlap(layout as LayoutSnapshot);
            expectReadableSpacing(layout as LayoutSnapshot);
        }
    });

    test('keeps settings controls accessible by pointer and keyboard after responsive reflow', async ({
        page,
    }) => {
        for (const viewport of RESPONSIVE_VIEWPORTS) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await loadSettings(page);

            const visibleControls = getSettingsControls(page);
            const controlCount = await visibleControls.count();
            expect(
                controlCount,
                `${viewport.name} should expose interactive settings controls`
            ).toBeGreaterThan(0);

            for (let index = 0; index < controlCount; index += 1) {
                const control = visibleControls.nth(index);
                await expect(control).toBeEnabled();
                await control.scrollIntoViewIfNeeded();
                await expect(control).toBeInViewport();

                const box = await control.boundingBox();
                expect(
                    box,
                    `control ${index} should be pointer-addressable at ${viewport.name}`
                ).not.toBeNull();
                expect(box?.width ?? 0).toBeGreaterThan(0);
                expect(box?.height ?? 0).toBeGreaterThan(0);
            }

            await page.keyboard.press('Home');
            const firstControl = visibleControls.first();
            await firstControl.focus();
            await expect(firstControl).toBeFocused();

            if (controlCount > 1) {
                await page.keyboard.press('Tab');
                await expect(visibleControls.nth(1)).toBeFocused();
            }
        }
    });

    test('keeps settings wide layout grouping stable', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await loadSettings(page);

        const desktopLayout = await page.evaluate(() => {
            const settingsContent = document.querySelector('.settings-content');
            const legacyUpgrade = document.querySelector('.legacy-upgrade');
            const qaTools = document.querySelector('.qa-tools');
            const cards = ['.logout-panel', '.panel', '.data-reset']
                .map((selector) => document.querySelector(selector))
                .filter((element): element is Element => element !== null);

            if (!settingsContent || !legacyUpgrade || cards.length < 3) {
                return null;
            }

            const toRoundedTop = (element: Element): number =>
                Math.round(element.getBoundingClientRect().top);

            const uniqueCardRows = new Set(cards.map(toRoundedTop));
            const settingsRect = settingsContent.getBoundingClientRect();
            const legacyRect = legacyUpgrade.getBoundingClientRect();
            const settingsStyles = getComputedStyle(settingsContent);
            const gridColumns = settingsStyles.gridTemplateColumns.split(' ').filter(Boolean);
            const settingsContentLeft =
                settingsRect.left + parseFloat(settingsStyles.paddingLeft || '0');
            const settingsContentRight =
                settingsRect.right - parseFloat(settingsStyles.paddingRight || '0');

            return {
                rowCount: uniqueCardRows.size,
                cardCount: cards.length,
                gridColumnCount: gridColumns.length,
                legacyGridColumn: getComputedStyle(legacyUpgrade).gridColumn,
                qaToolsGridColumn: qaTools ? getComputedStyle(qaTools).gridColumn : null,
                legacyLeftGap: Math.abs(legacyRect.left - settingsContentLeft),
                legacyRightGap: Math.abs(settingsContentRight - legacyRect.right),
            };
        });

        expect(desktopLayout).not.toBeNull();
        expect(desktopLayout?.gridColumnCount).toBeGreaterThan(1);
        expect(desktopLayout?.rowCount).toBeLessThan(desktopLayout?.cardCount ?? 0);
        expect(desktopLayout?.legacyGridColumn).toContain('1 / -1');
        expect(desktopLayout?.qaToolsGridColumn).not.toBe('1 / -1');
        expect(desktopLayout?.legacyLeftGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(4);
        expect(desktopLayout?.legacyRightGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(4);
    });
});
