import { expect, test } from '@playwright/test';

test.describe('IndexedDB availability', () => {
    test('does not trigger fallback alert when IndexedDB is available', async ({ page }) => {
        const dialogs: string[] = [];

        page.on('dialog', async (dialog) => {
            dialogs.push(dialog.message());
            await dialog.dismiss();
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Allow async initialization to surface any late fallback dialogs.
        await page.waitForTimeout(1000);
        expect(dialogs).toHaveLength(0);

        const indexedDbProbe = await page.evaluate(async () => {
            const supportsIndexedDb = typeof indexedDB !== 'undefined';
            if (!supportsIndexedDb) {
                return { supportsIndexedDb, canOpenDatabase: false, hasLightweightSnapshot: false };
            }

            const canOpenDatabase = await new Promise<boolean>((resolve) => {
                const request = indexedDB.open('dspaceGameState');
                request.onsuccess = () => {
                    request.result.close();
                    resolve(true);
                };
                request.onerror = () => resolve(false);
            });

            const hasLightweightSnapshot = await new Promise<boolean>((resolve) => {
                const maxWaitMs = 5000;
                const pollIntervalMs = 100;
                const startTime = Date.now();

                const check = () => {
                    if (localStorage.getItem('gameStateLite')) {
                        resolve(true);
                        return;
                    }

                    if (Date.now() - startTime >= maxWaitMs) {
                        resolve(false);
                        return;
                    }

                    setTimeout(check, pollIntervalMs);
                };

                check();
            });

            return { supportsIndexedDb, canOpenDatabase, hasLightweightSnapshot };
        });

        expect(indexedDbProbe.supportsIndexedDb).toBe(true);
        expect(indexedDbProbe.canOpenDatabase).toBe(true);
        expect(indexedDbProbe.hasLightweightSnapshot).toBe(true);
    });
});
