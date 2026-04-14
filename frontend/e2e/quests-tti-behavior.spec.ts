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

    test('shows only startable custom quests after merge and hides locked custom quests', async ({
        page,
    }) => {
        const availableCustomQuestTitle = `Available custom quest ${Date.now()}`;
        const lockedCustomQuestTitle = `Locked custom quest ${Date.now()}`;

        await seedCustomQuest(page, {
            title: availableCustomQuestTitle,
            description: 'No prerequisites, should be startable.',
            image: '/assets/quests/howtodoquests.jpg',
            custom: true,
            requiresQuests: [],
        });
        await seedCustomQuest(page, {
            title: lockedCustomQuestTitle,
            description: 'Requires unfinished built-in quest.',
            image: '/assets/quests/howtodoquests.jpg',
            custom: true,
            requiresQuests: ['3dprinting/start'],
        });

        await page.goto('/quests');
        const customMergeStatus = page.getByTestId('custom-quests-merge-status');
        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'true');
        await expect(customMergeStatus).toHaveAttribute('data-custom-count', '1');

        const customSection = page.getByTestId('custom-quests-section');
        await expect(customSection).toBeVisible();
        await expect(customSection).toContainText(availableCustomQuestTitle);
        await expect(customSection).not.toContainText(lockedCustomQuestTitle);
        await expect(customSection).not.toContainText('Locked');
    });
});
