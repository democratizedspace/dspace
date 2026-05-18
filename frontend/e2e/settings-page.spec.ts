import { test, expect, type Locator, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const settingsCardSelectors = [
    '.logout-panel',
    '.qa-cheats',
    '.panel',
    '.legacy-upgrade',
    '.data-reset',
];

const responsiveViewports = [
    { name: 'mobile', width: 375, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 900 },
];

const tabUntilFocused = async (page: Page, target: Locator, label: string) => {
    for (let index = 0; index < 40; index += 1) {
        await page.keyboard.press('Tab');
        if (await target.evaluate((element) => element === document.activeElement)) {
            return;
        }
    }

    await expect(target, label).toBeFocused();
};

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

    test('keeps settings cards spaced and grouped across responsive viewports', async ({
        page,
    }) => {
        for (const viewport of responsiveViewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto('/settings');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const layout = await page.evaluate((selectors) => {
                const settingsContent = document.querySelector('.settings-content');
                const cards = selectors
                    .map((selector) => ({ selector, element: document.querySelector(selector) }))
                    .filter(
                        (card): card is { selector: string; element: Element } =>
                            card.element !== null
                    );

                if (!settingsContent || cards.length < 4) {
                    return null;
                }

                const settingsRect = settingsContent.getBoundingClientRect();
                const settingsStyles = getComputedStyle(settingsContent);
                const contentLeft =
                    settingsRect.left + parseFloat(settingsStyles.paddingLeft || '0');
                const contentRight =
                    settingsRect.right - parseFloat(settingsStyles.paddingRight || '0');
                const gridColumns = settingsStyles.gridTemplateColumns.split(' ').filter(Boolean);
                const cardRects = cards.map(({ selector, element }) => {
                    const rect = element.getBoundingClientRect();
                    return {
                        selector,
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height,
                        gridColumn: getComputedStyle(element).gridColumn,
                    };
                });

                const overlaps = [];
                const minGapPx = gridColumns.length > 1 ? 12 : 16;
                const verticalGaps = [];

                for (let i = 0; i < cardRects.length; i += 1) {
                    const current = cardRects[i];
                    for (let j = i + 1; j < cardRects.length; j += 1) {
                        const next = cardRects[j];
                        const horizontalOverlap =
                            current.left < next.right && current.right > next.left;
                        const verticalOverlap =
                            current.top < next.bottom && current.bottom > next.top;
                        if (horizontalOverlap && verticalOverlap) {
                            overlaps.push(`${current.selector} overlaps ${next.selector}`);
                        }
                    }
                }

                const byTop = [...cardRects].sort((left, right) => left.top - right.top);
                for (let i = 0; i < byTop.length - 1; i += 1) {
                    const current = byTop[i];
                    const next = byTop[i + 1];
                    const sameColumn = current.left < next.right && current.right > next.left;
                    if (sameColumn && Math.round(current.bottom) <= Math.round(next.top)) {
                        verticalGaps.push(next.top - current.bottom);
                    }
                }

                const legacy = cardRects.find((card) => card.selector === '.legacy-upgrade');
                const rowCount = new Set(cardRects.map((card) => Math.round(card.top))).size;
                const fullWidthCards = cardRects
                    .filter(
                        (card) =>
                            Math.abs(card.left - contentLeft) <= 4 &&
                            Math.abs(contentRight - card.right) <= 4
                    )
                    .map((card) => card.selector);

                return {
                    cardCount: cardRects.length,
                    gridColumnCount: gridColumns.length,
                    rowCount,
                    overlaps,
                    minVerticalGap: verticalGaps.length ? Math.min(...verticalGaps) : null,
                    minCardWidth: Math.min(...cardRects.map((card) => card.width)),
                    maxCardRight: Math.max(...cardRects.map((card) => card.right)),
                    contentLeft,
                    contentRight,
                    legacyGridColumn: legacy?.gridColumn ?? '',
                    fullWidthCards,
                    minGapPx,
                };
            }, settingsCardSelectors);

            expect(layout, `${viewport.name} layout is present`).not.toBeNull();
            expect(layout?.overlaps, `${viewport.name} cards do not overlap`).toEqual([]);
            expect(layout?.minCardWidth, `${viewport.name} cards remain readable`).toBeGreaterThan(
                viewport.width === 375 ? 320 : 300
            );
            expect(
                layout?.maxCardRight ?? Number.POSITIVE_INFINITY,
                `${viewport.name} cards stay inside content bounds`
            ).toBeLessThanOrEqual((layout?.contentRight ?? 0) + 4);
            expect(
                layout?.minVerticalGap ?? layout?.minGapPx ?? 0,
                `${viewport.name} stacked cards keep readable spacing`
            ).toBeGreaterThanOrEqual(layout?.minGapPx ?? 0);

            if (viewport.width === 375) {
                expect(layout?.gridColumnCount, 'mobile stacks cards into one column').toBe(1);
                expect(layout?.rowCount, 'mobile places every card on its own row').toBe(
                    layout?.cardCount
                );
            } else {
                expect(
                    layout?.gridColumnCount,
                    `${viewport.name} uses a multi-column layout`
                ).toBeGreaterThan(1);
                expect(
                    layout?.rowCount,
                    `${viewport.name} keeps related cards grouped into rows`
                ).toBeLessThan(layout?.cardCount ?? 0);
                expect(
                    layout?.legacyGridColumn,
                    `${viewport.name} legacy upgrade spans the full settings group`
                ).toContain('1 / -1');
                expect(
                    layout?.fullWidthCards,
                    `${viewport.name} only intended cards span the full width`
                ).toEqual(['.legacy-upgrade']);
            }
        }
    });

    test('keeps settings controls reachable by keyboard and pointer after reflow', async ({
        page,
    }) => {
        for (const viewport of responsiveViewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto('/settings');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const questGraphToggle = page.getByRole('button', {
                name: 'Show quest dependency map on the quests page',
            });
            const chatDebugToggle = page.getByRole('button', {
                name: 'Show chat prompt debug on the chat page',
            });
            const logoutButton = page.getByRole('button', { name: 'Log out' });

            await expect(
                questGraphToggle,
                `${viewport.name} pointer target is visible`
            ).toBeVisible();
            await expect(
                chatDebugToggle,
                `${viewport.name} keyboard target is visible`
            ).toBeVisible();
            await expect(logoutButton, `${viewport.name} logout control is visible`).toBeVisible();

            const initialQuestGraphState = await questGraphToggle.getAttribute('aria-pressed');
            await questGraphToggle.click();
            await expect(
                questGraphToggle,
                `${viewport.name} pointer activation toggles the setting`
            ).not.toHaveAttribute('aria-pressed', initialQuestGraphState ?? '');

            await page.evaluate(() => {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            });
            await tabUntilFocused(
                page,
                logoutButton,
                `${viewport.name} keyboard tab order reaches logout`
            );
            await tabUntilFocused(
                page,
                page.getByTestId('settings-debug-link'),
                `${viewport.name} keyboard tab order reaches the debug link`
            );
            await tabUntilFocused(
                page,
                questGraphToggle,
                `${viewport.name} keyboard tab order reaches quest graph toggle`
            );
            await tabUntilFocused(
                page,
                chatDebugToggle,
                `${viewport.name} keyboard tab order reaches chat debug toggle`
            );

            const initialChatDebugState = await chatDebugToggle.getAttribute('aria-pressed');
            await page.keyboard.press('Space');
            await expect(
                chatDebugToggle,
                `${viewport.name} keyboard activation toggles the setting`
            ).not.toHaveAttribute('aria-pressed', initialChatDebugState ?? '');
        }
    });
});
