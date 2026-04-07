import { test, expect } from '@playwright/test';
import { clearUserData, seedCustomQuest } from './test-helpers';

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
        const customHeading = page.getByRole('heading', { name: 'Custom Quests' });
        await expect(builtInGrid).toBeAttached();
        await expect(customHeading).toHaveCount(0);
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
        await expect(customHeading).toHaveCount(0);
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
        await seedCustomQuest(page, {
            title: `Delayed custom quest ${Date.now()}`,
            description: 'Ensures custom section merge does not push built-in tiles.',
            image: '/assets/quests/howtodoquests.jpg',
            custom: true,
        });

        await page.addInitScript(() => {
            const delayMs = 700;
            const originalGetAll = IDBObjectStore.prototype.getAll;
            IDBObjectStore.prototype.getAll = function (...args) {
                const request = originalGetAll.apply(this, args);
                if (this.name !== 'quests') {
                    return request;
                }

                return new Proxy(request, {
                    set(target, prop, value) {
                        if (prop === 'onsuccess' && typeof value === 'function') {
                            const originalSuccess = value;
                            target.onsuccess = (event) => {
                                setTimeout(() => {
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
        const availableBuiltInQuest = builtInGrid.locator('[data-testid="quest-tile"]').first();
        await expect(availableBuiltInQuest).toBeVisible();
        const beforeBox = await availableBuiltInQuest.boundingBox();
        expect(beforeBox).not.toBeNull();

        const customShell = page.getByTestId('custom-quests-shell');
        await expect(customShell).toHaveAttribute('data-merged', 'false');
        await expect(customShell).toHaveAttribute('data-merged', 'true');

        const afterBox = await availableBuiltInQuest.boundingBox();
        expect(afterBox).not.toBeNull();
        expect(Math.abs((afterBox?.y ?? 0) - (beforeBox?.y ?? 0))).toBeLessThanOrEqual(1);
    });

    test('does not show optimistic Start before authoritative data exists', async ({ page }) => {
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

        await expect
            .poll(async () => {
                const statuses = await builtInGrid.getByTestId('quest-status-slot').allInnerTexts();
                return statuses.every((status) => status.includes('Start'));
            })
            .toBeTruthy();

        await expect(lockedQuest).toHaveCount(0);
    });
});
