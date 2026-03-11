import { test, expect } from '@playwright/test';

test('keeps IndexedDB available without fallback alert', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
        dialogs.push(dialog.message());
        await dialog.dismiss();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect
        .poll(async () =>
            page.evaluate(async () => {
                if (!('indexedDB' in window)) {
                    return { indexedDbPresent: false, rootStateExists: false };
                }

                return await new Promise<{ indexedDbPresent: boolean; rootStateExists: boolean }>(
                    (resolve) => {
                        const request = indexedDB.open('dspaceGameState');
                        request.onsuccess = () => {
                            const db = request.result;
                            const tx = db.transaction('state', 'readonly');
                            const getRequest = tx.objectStore('state').get('root');
                            getRequest.onsuccess = () => {
                                resolve({
                                    indexedDbPresent: true,
                                    rootStateExists: Boolean(getRequest.result),
                                });
                                db.close();
                            };
                            getRequest.onerror = () => {
                                resolve({ indexedDbPresent: true, rootStateExists: false });
                                db.close();
                            };
                        };
                        request.onerror = () =>
                            resolve({ indexedDbPresent: true, rootStateExists: false });
                    }
                );
            })
        )
        .toEqual({ indexedDbPresent: true, rootStateExists: true });

    expect(dialogs).not.toContain(
        'IndexedDB is unavailable; falling back to localStorage. Storage may be limited.'
    );
});
