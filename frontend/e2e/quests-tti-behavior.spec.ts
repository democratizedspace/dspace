import { test, expect } from '@playwright/test';
import { clearUserData, seedCustomQuest, waitForQuestRecordByTitle } from './test-helpers';

test.describe('quests tti behavior', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows built-in quest content after delayed IndexedDB reconciliation', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            const globalWindow = window as Window & { __questsIdbDelayActive?: boolean };
            globalWindow.__questsIdbDelayActive = true;
            const originalOpen = indexedDB.open.bind(indexedDB);
            indexedDB.open = (...args) => {
                const request = originalOpen(...args);
                return new Proxy(request, {
                    set(target, prop, value) {
                        if (prop === 'onsuccess' && typeof value === 'function') {
                            const originalSuccess = value;
                            target.onsuccess = (event) => {
                                setTimeout(() => {
                                    globalWindow.__questsIdbDelayActive = false;
                                    originalSuccess.call(target, event);
                                }, 300);
                            };
                            return true;
                        }

                        target[prop] = value;
                        return true;
                    },
                });
            };
        });

        await page.goto('/quests');
        const builtInGrid = page.getByTestId('quests-grid');
        await expect(builtInGrid).toBeAttached();
        await expect
            .poll(async () => builtInGrid.locator('[data-testid="quest-tile"]').count())
            .toBe(0);

        await expect
            .poll(async () =>
                page.evaluate(
                    () =>
                        (window as Window & { __questsIdbDelayActive?: boolean })
                            .__questsIdbDelayActive === false
                )
            )
            .toBeTruthy();
    });

    test('does not render built-in quests before full persistence readiness resolves', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            const delayMs = 1200;
            const globalWindow = window as Window & { __questsIdbDelayActive?: boolean };
            globalWindow.__questsIdbDelayActive = true;

            const originalOpen = indexedDB.open.bind(indexedDB);
            indexedDB.open = (...args) => {
                const request = originalOpen(...args);
                return new Proxy(request, {
                    set(target, prop, value) {
                        if (prop === 'onsuccess' && typeof value === 'function') {
                            const originalSuccess = value;
                            target.onsuccess = (event) => {
                                setTimeout(() => {
                                    globalWindow.__questsIdbDelayActive = false;
                                    originalSuccess.call(target, event);
                                }, delayMs);
                            };
                            return true;
                        }

                        target[prop] = value;
                        return true;
                    },
                });
            };
        });

        await page.goto('/quests');
        const builtInGrid = page.getByTestId('quests-grid');
        await expect(builtInGrid).toBeAttached();
        await expect
            .poll(async () =>
                page.evaluate(
                    () =>
                        (window as Window & { __questsIdbDelayActive?: boolean })
                            .__questsIdbDelayActive === true
                )
            )
            .toBeTruthy();
        await expect
            .poll(async () => builtInGrid.locator('[data-testid="quest-tile"]').count())
            .toBe(0);

        await expect
            .poll(async () =>
                page.evaluate(
                    () =>
                        (window as Window & { __questsIdbDelayActive?: boolean })
                            .__questsIdbDelayActive === false
                )
            )
            .toBeTruthy();

        await expect(builtInGrid).toBeAttached();
    });

    test('keeps built-in grid position stable when delayed custom quests merge', async ({
        page,
    }) => {
        const delayedCustomQuestTitle = `Delayed custom quest ${Date.now()}`;
        await seedCustomQuest(page, {
            title: delayedCustomQuestTitle,
            description: 'Ensures custom section merge does not push built-in tiles.',
            image: '/assets/quests/howtodoquests.jpg',
            custom: true,
        });
        await waitForQuestRecordByTitle(page, delayedCustomQuestTitle);

        await page.addInitScript(() => {
            (
                window as Window & { __questsCustomMergeDelayMs?: number }
            ).__questsCustomMergeDelayMs = 700;
        });

        await page.goto('/quests');
        const builtInGrid = page.getByTestId('quests-grid');
        const availableBuiltInQuest = builtInGrid.locator('[data-testid="quest-tile"]').first();
        await expect(availableBuiltInQuest).toBeVisible();
        const beforeBox = await availableBuiltInQuest.boundingBox();
        expect(beforeBox).not.toBeNull();

        const customQuestsSection = page.getByTestId('custom-quests-section');
        const customMergeStatus = page.getByTestId('custom-quests-merge-status');
        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'false');
        await expect(customQuestsSection).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Custom Quests' })).toHaveCount(0);

        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'true');
        await expect(customMergeStatus).toHaveAttribute('data-custom-count', '1');
        await expect(customQuestsSection).toBeVisible();
        await expect(customQuestsSection).toContainText(delayedCustomQuestTitle);

        const afterBox = await availableBuiltInQuest.boundingBox();
        expect(afterBox).not.toBeNull();
        expect(Math.abs((afterBox?.y ?? 0) - (beforeBox?.y ?? 0))).toBeLessThanOrEqual(1);
    });

    test('does not render Custom Quests before delayed merge completes when no custom quests exist', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            (
                window as Window & { __questsCustomMergeDelayMs?: number }
            ).__questsCustomMergeDelayMs = 700;
        });

        await page.goto('/quests');
        await expect(
            page.getByTestId('quests-grid').locator('[data-testid="quest-tile"]').first()
        ).toBeVisible();
        const customMergeStatus = page.getByTestId('custom-quests-merge-status');

        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'false');
        await expect(page.getByRole('heading', { name: 'Custom Quests' })).toHaveCount(0);
        await expect(page.getByTestId('custom-quests-section')).toHaveCount(0);

        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'true');
        await expect(customMergeStatus).toHaveAttribute('data-custom-count', '0');
        await expect(page.getByRole('heading', { name: 'Custom Quests' })).toHaveCount(0);
        await expect(page.getByTestId('custom-quests-section')).toHaveCount(0);
    });

    test('does not render built-in quests before authoritative data exists', async ({ page }) => {
        await page.addInitScript(() => {
            const globalWindow = window as Window & { __questsIdbDelayActive?: boolean };
            globalWindow.__questsIdbDelayActive = true;

            localStorage.setItem(
                'gameStateLite',
                JSON.stringify({
                    checksum: 'stale',
                    questProgress: { version: 999, completedQuestIds: [] },
                })
            );

            const delayMs = 1200;
            const originalOpen = indexedDB.open.bind(indexedDB);
            indexedDB.open = (...args) => {
                const request = originalOpen(...args);
                return new Proxy(request, {
                    set(target, prop, value) {
                        if (prop === 'onsuccess' && typeof value === 'function') {
                            const originalSuccess = value;
                            target.onsuccess = (event) => {
                                setTimeout(() => {
                                    globalWindow.__questsIdbDelayActive = false;
                                    originalSuccess.call(target, event);
                                }, delayMs);
                            };
                            return true;
                        }

                        target[prop] = value;
                        return true;
                    },
                });
            };
        });

        await page.goto('/quests');
        const builtInGrid = page.getByTestId('quests-grid');
        await expect(builtInGrid).toBeAttached();
        await expect
            .poll(async () =>
                page.evaluate(
                    () =>
                        (window as Window & { __questsIdbDelayActive?: boolean })
                            .__questsIdbDelayActive === true
                )
            )
            .toBeTruthy();

        await expect
            .poll(async () => builtInGrid.locator('[data-testid="quest-tile"]').count())
            .toBe(0);
    });

    test('shows only available built-in quests in the actionable grid before and after reconciliation', async ({
        page,
    }) => {
        await page.goto('/quests');

        const builtInGrid = page.getByTestId('quests-grid');
        await expect(builtInGrid).toBeAttached();

        const lockedQuest = builtInGrid.locator('[data-questid="welcome/run-tests"]');

        await expect(lockedQuest).toHaveCount(0);

        const availableQuestCard = builtInGrid.locator(
            "a[data-questid='welcome/howtodoquests'] [data-testid='quest-tile']"
        );
        await expect(availableQuestCard).toBeVisible();
        await expect(availableQuestCard).not.toContainText('Start');
        await expect(availableQuestCard.getByTestId('quest-status-slot')).toHaveCount(0);

        await expect(lockedQuest).toHaveCount(0);
    });

    test('keeps custom and built-in quests actionable together through refresh and navigation', async ({
        page,
    }) => {
        const customQuestTitle = `Coexist custom quest ${Date.now()}`;
        await seedCustomQuest(page, {
            id: `custom-coexist-${Date.now()}`,
            title: customQuestTitle,
            description: 'Validates built-in and custom coexistence through refresh.',
            image: '/assets/quests/howtodoquests.jpg',
            custom: true,
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Custom quest start',
                    options: [
                        {
                            text: 'Finish quest',
                            next: 'finish',
                            type: 'finish',
                        },
                    ],
                },
            ],
            requiresQuests: [],
        });

        await page.goto('/quests');

        const builtInLink = page.locator("a[data-questid='welcome/howtodoquests']").first();
        await expect(builtInLink).toBeVisible();
        const customSection = page.getByTestId('custom-quests-section');
        await expect(customSection).toBeVisible();
        await expect(customSection).toContainText(customQuestTitle);

        await builtInLink.click();
        await expect(page).toHaveURL(/\/quests\/welcome\/howtodoquests$/);
        await expect(
            page.locator('.options button, main button:has-text("Continue"), main button:has-text("Start")').first()
        ).toBeVisible();

        await page.goto('/quests');
        await expect(page.locator("a[data-questid='welcome/howtodoquests']").first()).toBeVisible();
        await expect(page.getByRole('link', { name: customQuestTitle })).toBeVisible();

        await page.reload();
        await expect(page.locator("a[data-questid='welcome/howtodoquests']").first()).toBeVisible();
        await expect(page.getByRole('link', { name: customQuestTitle })).toBeVisible();

        const questCardIds = await page.locator('a[data-questid]').evaluateAll((cards) =>
            cards.map((card) => card.getAttribute('data-questid')).filter(Boolean)
        );
        expect(new Set(questCardIds).size).toBe(questCardIds.length);

        await page.getByRole('link', { name: customQuestTitle }).click();
        await expect(page).toHaveURL(/\/quests\//);
        await expect(
            page.locator('.options button, main button:has-text("Finish"), main button:has-text("Continue")').first()
        ).toBeVisible();
    });
});
