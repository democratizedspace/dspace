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

        await expect.poll(() => dialogs.length).toBe(0);

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

            const hasLightweightSnapshot = Boolean(localStorage.getItem('gameStateLite'));
            return { supportsIndexedDb, canOpenDatabase, hasLightweightSnapshot };
        });

        expect(indexedDbProbe.supportsIndexedDb).toBe(true);
        expect(indexedDbProbe.canOpenDatabase).toBe(true);
        expect(indexedDbProbe.hasLightweightSnapshot).toBe(true);
    });
});
