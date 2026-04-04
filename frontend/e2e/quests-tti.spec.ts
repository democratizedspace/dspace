import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('/quests TTI optimization', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows built-in quest list even when IndexedDB open is delayed', async ({ page }) => {
        await page.addInitScript(() => {
            const originalOpen = indexedDB.open.bind(indexedDB);
            indexedDB.open = (...args) => {
                const request = originalOpen(...args);
                request.addEventListener('success', (event) => {
                    const target = event.target as IDBOpenDBRequest | null;
                    target?.result?.close();
                });
                return request;
            };
        });

        await page.goto('/quests');
        await waitForHydration(page);

        await expect(
            page.locator('[data-testid="quests-grid"] [data-testid="quest-tile"]').first()
        ).toBeVisible();
    });

    test('emits user timing marks for measurement harness', async ({ page }) => {
        await page.goto('/quests');
        await waitForHydration(page);

        await expect
            .poll(async () =>
                page.evaluate(() =>
                    performance
                        .getEntriesByType('mark')
                        .map((entry) => entry.name)
                        .filter((name) => name.startsWith('quests:'))
                )
            )
            .toEqual(
                expect.arrayContaining([
                    'quests:hydration-start',
                    'quests:builtin-visible',
                    'quests:snapshot-classification-ready',
                    'quests:custom-merged',
                ])
            );
    });
});
