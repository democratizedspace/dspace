import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('IndexedDB availability guardrail', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('does not show IndexedDB fallback warning when IndexedDB is available', async ({
        page,
    }) => {
        const dialogs: string[] = [];
        page.on('dialog', async (dialog) => {
            dialogs.push(dialog.message());
            await dialog.dismiss();
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const indexedDbStatus = await page.evaluate(async () => {
            if (!('indexedDB' in globalThis) || typeof indexedDB.open !== 'function') {
                return 'missing';
            }

            try {
                const opened = await new Promise<boolean>((resolve) => {
                    const request = indexedDB.open('dspaceGameState');
                    request.onsuccess = () => {
                        request.result.close();
                        resolve(true);
                    };
                    request.onerror = () => resolve(false);
                });

                return opened ? 'open-ok' : 'open-failed';
            } catch {
                return 'open-failed';
            }
        });

        expect(indexedDbStatus).toBe('open-ok');
        expect(dialogs).not.toContain(
            'IndexedDB is unavailable; falling back to localStorage. Storage may be limited.'
        );
    });
});
