import { expect, test } from '@playwright/test';

const FALLBACK_ALERT_TEXT =
    'IndexedDB is unavailable; falling back to localStorage. Storage may be limited.';

test.describe('indexeddb availability', () => {
    test('does not show IndexedDB fallback alert and keeps meta store available', async ({
        page,
    }) => {
        const dialogs: string[] = [];

        page.on('dialog', async (dialog) => {
            dialogs.push(dialog.message());
            await dialog.dismiss();
        });

        await page.goto('/');

        const indexedDbStatus = await page.evaluate(async () => {
            if (!('indexedDB' in globalThis)) {
                return { supported: false, hasMetaStore: false };
            }

            return new Promise<{ supported: boolean; hasMetaStore: boolean }>((resolve) => {
                const request = indexedDB.open('dspaceGameState');
                request.onsuccess = () => {
                    const db = request.result;
                    const hasMetaStore = db.objectStoreNames.contains('meta');
                    db.close();
                    resolve({ supported: true, hasMetaStore });
                };
                request.onerror = () => resolve({ supported: true, hasMetaStore: false });
            });
        });

        expect(indexedDbStatus.supported).toBe(true);
        expect(indexedDbStatus.hasMetaStore).toBe(true);
        expect(dialogs).not.toContain(FALLBACK_ALERT_TEXT);
    });
});
