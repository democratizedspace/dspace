import { test, expect, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

type SettingsViewport = {
    name: string;
    width: number;
    height: number;
    expectedColumns: 'single' | 'multiple';
};

const SETTINGS_VIEWPORTS: SettingsViewport[] = [
    { name: 'mobile', width: 375, height: 844, expectedColumns: 'single' },
    { name: 'tablet', width: 768, height: 1024, expectedColumns: 'multiple' },
    { name: 'desktop', width: 1280, height: 900, expectedColumns: 'multiple' },
];

async function openSettingsAtViewport(page: Page, viewport: SettingsViewport) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
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

    for (const viewport of SETTINGS_VIEWPORTS) {
        test(`keeps settings cards spaced without overlap at ${viewport.name} width`, async ({
            page,
        }) => {
            await openSettingsAtViewport(page, viewport);

            const layout = await page.evaluate(() => {
                const settingsContent = document.querySelector('.settings-content');
                const cards = Array.from(
                    document.querySelectorAll(
                        '.settings-content > .logout-panel, .settings-content > .qa-cheats, .settings-content > .qa-tools, .settings-content > .panel, .settings-content > .legacy-upgrade, .settings-content > .data-reset'
                    )
                );

                if (!settingsContent || cards.length < 3) {
                    return null;
                }

                const contentRect = settingsContent.getBoundingClientRect();
                const contentStyles = getComputedStyle(settingsContent);
                const contentLeft = contentRect.left + parseFloat(contentStyles.paddingLeft || '0');
                const contentRight =
                    contentRect.right - parseFloat(contentStyles.paddingRight || '0');
                const gridColumns = contentStyles.gridTemplateColumns.split(' ').filter(Boolean);
                const cardRects = cards.map((card) => {
                    const rect = card.getBoundingClientRect();
                    return {
                        className: card.className,
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height,
                    };
                });

                const overlaps: string[] = [];
                let minimumGap = Number.POSITIVE_INFINITY;

                for (let firstIndex = 0; firstIndex < cardRects.length; firstIndex += 1) {
                    for (
                        let secondIndex = firstIndex + 1;
                        secondIndex < cardRects.length;
                        secondIndex += 1
                    ) {
                        const first = cardRects[firstIndex];
                        const second = cardRects[secondIndex];
                        const xOverlap =
                            Math.min(first.right, second.right) - Math.max(first.left, second.left);
                        const yOverlap =
                            Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);

                        if (xOverlap > 0 && yOverlap > 0) {
                            overlaps.push(`${first.className} overlaps ${second.className}`);
                            continue;
                        }

                        if (xOverlap > 0) {
                            minimumGap = Math.min(
                                minimumGap,
                                Math.abs(
                                    Math.max(first.top, second.top) -
                                        Math.min(first.bottom, second.bottom)
                                )
                            );
                        } else if (yOverlap > 0) {
                            minimumGap = Math.min(
                                minimumGap,
                                Math.abs(
                                    Math.max(first.left, second.left) -
                                        Math.min(first.right, second.right)
                                )
                            );
                        }
                    }
                }

                return {
                    cardCount: cardRects.length,
                    gridColumnCount: gridColumns.length,
                    overlaps,
                    minimumGap: Number.isFinite(minimumGap) ? minimumGap : null,
                    horizontalOverflow: cardRects.filter(
                        (rect) => rect.left < contentLeft - 1 || rect.right > contentRight + 1
                    ),
                    undersizedCards: cardRects.filter(
                        (rect) => rect.width <= 0 || rect.height <= 0
                    ),
                };
            });

            expect(layout).not.toBeNull();
            expect(layout?.cardCount).toBeGreaterThanOrEqual(3);
            expect(layout?.overlaps).toEqual([]);
            expect(layout?.horizontalOverflow).toEqual([]);
            expect(layout?.undersizedCards).toEqual([]);
            expect(layout?.minimumGap ?? 16).toBeGreaterThanOrEqual(12);

            if (viewport.expectedColumns === 'single') {
                expect(layout?.gridColumnCount).toBe(1);
            } else {
                expect(layout?.gridColumnCount).toBeGreaterThan(1);
            }
        });

        test(`keeps settings controls keyboard and pointer accessible at ${viewport.name} width`, async ({
            page,
        }) => {
            await openSettingsAtViewport(page, viewport);

            const controls = page.locator(
                '.settings-content a[href], .settings-content button:not([disabled]), .settings-content select:not([disabled]), .settings-content input:not([disabled]), .settings-content textarea:not([disabled])'
            );
            const controlCount = await controls.count();
            expect(controlCount).toBeGreaterThanOrEqual(3);

            for (let index = 0; index < controlCount; index += 1) {
                await expect(controls.nth(index)).toBeVisible();
                await controls.nth(index).click({ trial: true });
            }

            const tabbableControlIds = await page.evaluate(() => {
                const selector =
                    '.settings-content a[href], .settings-content button:not([disabled]), .settings-content select:not([disabled]), .settings-content input:not([disabled]), .settings-content textarea:not([disabled])';
                return Array.from(document.querySelectorAll<HTMLElement>(selector))
                    .filter((element) => element.offsetParent !== null)
                    .map((element, index) => {
                        const id = `settings-focus-target-${index}`;
                        element.dataset.settingsFocusTarget = id;
                        return id;
                    });
            });

            const focusedControlIds = new Set<string>();
            await controls.first().focus();
            focusedControlIds.add(tabbableControlIds[0]);

            for (let index = 1; index < tabbableControlIds.length; index += 1) {
                await page.keyboard.press('Tab');
                const focusedId = await page.evaluate(() =>
                    document.activeElement instanceof HTMLElement
                        ? document.activeElement.dataset.settingsFocusTarget
                        : undefined
                );

                if (focusedId) {
                    focusedControlIds.add(focusedId);
                }
            }

            expect([...focusedControlIds].sort()).toEqual([...tabbableControlIds].sort());
        });
    }

    test('keeps wide settings layout grouped without unexpected full-width cards', async ({
        page,
    }) => {
        await openSettingsAtViewport(page, {
            name: 'desktop',
            width: 1280,
            height: 900,
            expectedColumns: 'multiple',
        });

        const desktopLayout = await page.evaluate(() => {
            const settingsContent = document.querySelector('.settings-content');
            const legacyUpgrade = document.querySelector('.legacy-upgrade');
            const qaTools = document.querySelector('.qa-tools');
            const cards = ['.logout-panel', '.qa-cheats', '.panel', '.data-reset']
                .map((selector) => document.querySelector(selector))
                .filter((element): element is Element => element !== null);

            if (!settingsContent || !legacyUpgrade || cards.length < 3) {
                return null;
            }

            const settingsRect = settingsContent.getBoundingClientRect();
            const settingsStyles = getComputedStyle(settingsContent);
            const gridColumns = settingsStyles.gridTemplateColumns.split(' ').filter(Boolean);
            const settingsContentLeft =
                settingsRect.left + parseFloat(settingsStyles.paddingLeft || '0');
            const settingsContentRight =
                settingsRect.right - parseFloat(settingsStyles.paddingRight || '0');
            const contentWidth = settingsContentRight - settingsContentLeft;
            const fullWidthElements = [legacyUpgrade, qaTools].filter(
                (element): element is Element => element !== null
            );

            const toRoundedTop = (element: Element): number =>
                Math.round(element.getBoundingClientRect().top);
            const uniqueCardRows = new Set(cards.map(toRoundedTop));

            return {
                rowCount: uniqueCardRows.size,
                cardCount: cards.length,
                gridColumnCount: gridColumns.length,
                fullWidthCards: fullWidthElements.map((element) => {
                    const rect = element.getBoundingClientRect();
                    return {
                        className: element.className,
                        gridColumn: getComputedStyle(element).gridColumn,
                        leftGap: Math.abs(rect.left - settingsContentLeft),
                        rightGap: Math.abs(settingsContentRight - rect.right),
                    };
                }),
                unexpectedFullWidthCards: cards
                    .filter((element) => element.getBoundingClientRect().width > contentWidth * 0.9)
                    .map((element) => element.className),
            };
        });

        expect(desktopLayout).not.toBeNull();
        expect(desktopLayout?.gridColumnCount).toBeGreaterThan(1);
        expect(desktopLayout?.rowCount).toBeLessThan(desktopLayout?.cardCount ?? 0);
        expect(desktopLayout?.unexpectedFullWidthCards).toEqual([]);

        for (const fullWidthCard of desktopLayout?.fullWidthCards ?? []) {
            expect(fullWidthCard.gridColumn).toContain('1 / -1');
            expect(fullWidthCard.leftGap).toBeLessThanOrEqual(4);
            expect(fullWidthCard.rightGap).toBeLessThanOrEqual(4);
        }
    });
});
