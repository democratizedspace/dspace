import { test, expect, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const SETTINGS_CARD_SELECTORS = [
    '.logout-panel',
    '.qa-cheats',
    '.panel',
    '.legacy-upgrade',
    '.data-reset',
];

const RESPONSIVE_VIEWPORTS = [
    { name: 'mobile', width: 375, height: 844, minimumColumns: 1, maximumColumns: 1 },
    { name: 'tablet', width: 768, height: 1024, minimumColumns: 2 },
    { name: 'desktop', width: 1280, height: 900, minimumColumns: 2 },
];

async function loadSettingsAtViewport(page: Page, width: number, height: number) {
    await page.setViewportSize({ width, height });
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);
}

test.describe('Settings route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads settings page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
        await expect(
            page.getByRole('heading', { level: 2, name: 'Manage your DSPACE session' })
        ).toBeVisible();
        await expect(page.getByRole('heading', { level: 3, name: 'Log out' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
        await expect(page.getByTestId('logout-state')).toHaveText('No saved credentials detected.');
    });

    test('keeps settings cards spaced without overlap at mobile, tablet, and desktop widths', async ({
        page,
    }) => {
        for (const viewport of RESPONSIVE_VIEWPORTS) {
            await loadSettingsAtViewport(page, viewport.width, viewport.height);

            const layout = await page.evaluate((selectors) => {
                const settingsContent = document.querySelector('.settings-content');
                const cards = selectors
                    .map((selector) => document.querySelector(selector))
                    .filter(
                        (element): element is HTMLElement =>
                            element instanceof HTMLElement && element.offsetParent !== null
                    );

                if (!(settingsContent instanceof HTMLElement) || cards.length < 4) {
                    return null;
                }

                const rects = cards.map((element) => {
                    const rect = element.getBoundingClientRect();
                    return {
                        selector: selectors.find((selector) => element.matches(selector)) ?? '',
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height,
                    };
                });

                const viewportWidth = document.documentElement.clientWidth;
                const viewportHeight = document.documentElement.clientHeight;
                const contentRect = settingsContent.getBoundingClientRect();
                const contentStyles = getComputedStyle(settingsContent);
                const gridColumns = contentStyles.gridTemplateColumns.split(' ').filter(Boolean);
                const overflowX =
                    Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
                    viewportWidth;
                const overlapPairs: string[] = [];
                const tightGapPairs: string[] = [];

                for (let i = 0; i < rects.length; i += 1) {
                    for (let j = i + 1; j < rects.length; j += 1) {
                        const first = rects[i];
                        const second = rects[j];
                        const horizontalOverlap =
                            first.left < second.right - 1 && second.left < first.right - 1;
                        const verticalOverlap =
                            first.top < second.bottom - 1 && second.top < first.bottom - 1;

                        if (horizontalOverlap && verticalOverlap) {
                            overlapPairs.push(`${first.selector} overlaps ${second.selector}`);
                            continue;
                        }

                        const sameRow = Math.abs(first.top - second.top) <= 2;
                        const sameColumn = horizontalOverlap;
                        const horizontalGap = Math.max(
                            second.left - first.right,
                            first.left - second.right
                        );
                        const verticalGap = Math.max(
                            second.top - first.bottom,
                            first.top - second.bottom
                        );

                        if (sameRow && horizontalGap < 12) {
                            tightGapPairs.push(
                                `${first.selector} and ${second.selector} have ${horizontalGap}px horizontal gap`
                            );
                        }

                        if (sameColumn && verticalGap < 12) {
                            tightGapPairs.push(
                                `${first.selector} and ${second.selector} have ${verticalGap}px vertical gap`
                            );
                        }
                    }
                }

                const offscreenCards = rects
                    .filter(
                        (rect) =>
                            rect.left < -1 ||
                            rect.right > viewportWidth + 1 ||
                            rect.top < -1 ||
                            rect.height <= 0 ||
                            rect.width <= 0 ||
                            rect.top > viewportHeight * 3
                    )
                    .map((rect) => rect.selector);

                return {
                    cardCount: rects.length,
                    contentWidth: contentRect.width,
                    gridColumnCount: gridColumns.length,
                    overflowX,
                    overlapPairs,
                    tightGapPairs,
                    offscreenCards,
                };
            }, SETTINGS_CARD_SELECTORS);

            expect(layout, `${viewport.name} layout should render settings cards`).not.toBeNull();
            expect(
                layout?.cardCount,
                `${viewport.name} should render all core cards`
            ).toBeGreaterThanOrEqual(4);
            expect(
                layout?.gridColumnCount,
                `${viewport.name} should use the expected responsive grid columns`
            ).toBeGreaterThanOrEqual(viewport.minimumColumns);

            if (viewport.maximumColumns) {
                expect(
                    layout?.gridColumnCount,
                    `${viewport.name} should keep cards in one readable column`
                ).toBeLessThanOrEqual(viewport.maximumColumns);
            }

            expect(
                layout?.overflowX,
                `${viewport.name} should not create horizontal scrolling`
            ).toBeLessThanOrEqual(1);
            expect(layout?.overlapPairs, `${viewport.name} cards should not overlap`).toEqual([]);
            expect(
                layout?.tightGapPairs,
                `${viewport.name} cards should keep readable spacing`
            ).toEqual([]);
            expect(
                layout?.offscreenCards,
                `${viewport.name} cards should remain in viewport flow`
            ).toEqual([]);
        }
    });

    test('keeps settings controls reachable by keyboard and pointer after responsive reflow', async ({
        page,
    }) => {
        for (const viewport of RESPONSIVE_VIEWPORTS) {
            await loadSettingsAtViewport(page, viewport.width, viewport.height);

            const controlAudit = await page.evaluate(() => {
                const settingsContent = document.querySelector('.settings-content');
                if (!(settingsContent instanceof HTMLElement)) {
                    return null;
                }

                const controls = Array.from(
                    settingsContent.querySelectorAll<HTMLElement>(
                        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    )
                ).filter((element) => element.offsetParent !== null);

                const pointerBlocked: string[] = [];

                controls.forEach((element, index) => {
                    element.dataset.settingsFocusIndex = String(index);
                    const rect = element.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const hitTarget = document.elementFromPoint(centerX, centerY);

                    if (!hitTarget || (hitTarget !== element && !element.contains(hitTarget))) {
                        const label =
                            element.getAttribute('aria-label') ||
                            element.textContent?.trim() ||
                            element.tagName;
                        pointerBlocked.push(label.replace(/\s+/g, ' '));
                    }
                });

                return {
                    controlCount: controls.length,
                    pointerBlocked,
                };
            });

            expect(controlAudit, `${viewport.name} controls should render`).not.toBeNull();
            expect(
                controlAudit?.controlCount,
                `${viewport.name} should expose interactive settings controls`
            ).toBeGreaterThanOrEqual(4);
            expect(
                controlAudit?.pointerBlocked,
                `${viewport.name} controls should be available to pointer hit testing`
            ).toEqual([]);

            const reached = new Set<string>();
            await page.evaluate(() => {
                document.body.focus();
            });

            for (let tabCount = 0; tabCount < 40; tabCount += 1) {
                await page.keyboard.press('Tab');
                const focusedIndex = await page.evaluate(() => {
                    const activeElement = document.activeElement;
                    if (!(activeElement instanceof HTMLElement)) {
                        return null;
                    }
                    return activeElement.closest<HTMLElement>('[data-settings-focus-index]')
                        ?.dataset.settingsFocusIndex;
                });

                if (focusedIndex !== undefined && focusedIndex !== null) {
                    reached.add(focusedIndex);
                }

                if (reached.size === controlAudit?.controlCount) {
                    break;
                }
            }

            expect(
                reached.size,
                `${viewport.name} keyboard tab order should reach every enabled settings control`
            ).toBe(controlAudit?.controlCount);
        }
    });

    test('keeps wide settings layout grouped without unexpected full-width spans', async ({
        page,
    }) => {
        await loadSettingsAtViewport(page, 1280, 900);

        const desktopLayout = await page.evaluate(() => {
            const settingsContent = document.querySelector('.settings-content');
            const normalCards = ['.logout-panel', '.panel', '.data-reset']
                .map((selector) => document.querySelector(selector))
                .filter((element): element is Element => element !== null);
            const legacyUpgrade = document.querySelector('.legacy-upgrade');

            if (!settingsContent || !legacyUpgrade || normalCards.length < 3) {
                return null;
            }

            const toRoundedTop = (element: Element): number =>
                Math.round(element.getBoundingClientRect().top);
            const uniqueCardRows = new Set(normalCards.map(toRoundedTop));
            const settingsRect = settingsContent.getBoundingClientRect();
            const legacyRect = legacyUpgrade.getBoundingClientRect();
            const settingsStyles = getComputedStyle(settingsContent);
            const gridColumns = settingsStyles.gridTemplateColumns.split(' ').filter(Boolean);
            const settingsContentLeft =
                settingsRect.left + parseFloat(settingsStyles.paddingLeft || '0');
            const settingsContentRight =
                settingsRect.right - parseFloat(settingsStyles.paddingRight || '0');
            const unexpectedFullWidthCards = normalCards
                .filter((element) => getComputedStyle(element).gridColumn.includes('1 / -1'))
                .map((element) => element.className);

            return {
                rowCount: uniqueCardRows.size,
                cardCount: normalCards.length,
                gridColumnCount: gridColumns.length,
                legacyGridColumn: getComputedStyle(legacyUpgrade).gridColumn,
                legacyLeftGap: Math.abs(legacyRect.left - settingsContentLeft),
                legacyRightGap: Math.abs(settingsContentRight - legacyRect.right),
                unexpectedFullWidthCards,
            };
        });

        expect(desktopLayout).not.toBeNull();
        expect(desktopLayout?.gridColumnCount).toBeGreaterThan(1);
        expect(desktopLayout?.rowCount).toBeLessThan(desktopLayout?.cardCount ?? 0);
        expect(desktopLayout?.legacyGridColumn).toContain('1 / -1');
        expect(desktopLayout?.legacyLeftGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(4);
        expect(desktopLayout?.legacyRightGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(4);
        expect(desktopLayout?.unexpectedFullWidthCards).toEqual([]);
    });
});
