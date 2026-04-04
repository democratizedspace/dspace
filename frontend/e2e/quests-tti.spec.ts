import { expect, test } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('/quests TTI behavior', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('shows built-in quest list before delayed full-state readiness', async ({ page }) => {
        await page.addInitScript(() => {
            const originalOpen = window.indexedDB.open.bind(window.indexedDB);
            window.indexedDB.open = (...args) => {
                const request = originalOpen(...args);
                const originalSetter = Object.getOwnPropertyDescriptor(
                    IDBOpenDBRequest.prototype,
                    'onsuccess'
                )?.set;

                if (originalSetter) {
                    originalSetter.call(request, null);
                }

                request.addEventListener('success', (event) => {
                    event.stopImmediatePropagation();
                    setTimeout(() => {
                        request.dispatchEvent(new Event('success'));
                        if (typeof request.onsuccess === 'function') {
                            request.onsuccess(new Event('success'));
                        }
                    }, 1200);
                });

                return request;
            };
        });

        await page.goto('/quests');
        await waitForHydration(page);

        await expect(page.getByTestId('quests-grid')).toBeVisible();
        await expect(page.getByRole('link', { name: /how to do quests/i })).toBeVisible();
        await expect(page.getByText('Status unavailable').first()).toBeVisible();
        await expect(page.getByText('Ready to start')).toHaveCount(0);
    });
});
