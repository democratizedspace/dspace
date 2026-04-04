import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('quests tti behavior', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows built-in quest content even when IndexedDB is delayed', async ({ page }) => {
        await page.addInitScript(() => {
            const originalOpen = indexedDB.open.bind(indexedDB);
            indexedDB.open = (...args) => {
                const request = originalOpen(...args);
                return new Proxy(request, {
                    set(target, prop, value) {
                        if (prop === 'onsuccess' && typeof value === 'function') {
                            const originalSuccess = value;
                            target.onsuccess = (event) => {
                                setTimeout(() => {
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
        await expect(page.getByTestId('quests-grid')).toBeVisible();
        await expect(page.locator('[data-testid="quest-tile"]').first()).toBeVisible();
    });

    test('does not show optimistic Start before authoritative data exists', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem(
                'gameStateLite',
                JSON.stringify({
                    checksum: 'stale',
                    questProgress: { version: 999, completedQuestIds: [] },
                })
            );
        });

        await page.goto('/quests');
        await expect(page.getByTestId('quests-grid')).toBeVisible();

        const statuses = page.getByTestId('quest-status-slot');
        await expect(statuses.first()).toBeVisible();
        const firstStatuses = await statuses.allInnerTexts();
        expect(firstStatuses.some((status) => status.includes('Start'))).toBe(false);
    });
});
