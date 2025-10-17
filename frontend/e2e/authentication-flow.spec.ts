import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('Authentication flow', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test.afterEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('saves and clears the token reliably', async ({ page }) => {
        const token = 'ghp_' + 'a'.repeat(36);

        await page.goto('/cloudsync');
        await waitForHydration(page);

        const tokenInput = page.getByLabel(/GitHub Token/);
        await expect(tokenInput).toBeVisible();
        await tokenInput.fill(token);
        await page.getByRole('button', { name: 'Save' }).click();

        const readStoredToken = async () =>
            page.evaluate(async () => {
                async function readFromIndexedDb() {
                    return await new Promise<string>((resolve) => {
                        try {
                            const request = window.indexedDB.open('dspaceGameState');
                            request.onerror = () => resolve('');
                            request.onsuccess = () => {
                                const db = request.result;
                                if (!db.objectStoreNames.contains('state')) {
                                    resolve('');
                                    return;
                                }
                                const tx = db.transaction('state', 'readonly');
                                const store = tx.objectStore('state');
                                const getReq = store.get('root');
                                getReq.onerror = () => resolve('');
                                getReq.onsuccess = () => {
                                    const state = getReq.result as
                                        | { github?: { token?: string } }
                                        | undefined;
                                    resolve(state?.github?.token ?? '');
                                };
                            };
                        } catch {
                            resolve('');
                        }
                    });
                }

                const tokenFromIndexedDb = await readFromIndexedDb();
                if (tokenFromIndexedDb) {
                    return tokenFromIndexedDb;
                }

                try {
                    const persisted = JSON.parse(
                        window.localStorage.getItem('gameState') ?? '{}'
                    ) as { github?: { token?: string } };
                    return persisted.github?.token ?? '';
                } catch {
                    return '';
                }
            });

        await expect.poll(readStoredToken, { timeout: 5_000 }).toBe(token);

        await page.reload();
        await waitForHydration(page);

        await expect(page.getByLabel(/GitHub Token/)).toHaveValue(token);

        await page.getByTestId('clear-sync-token').click();

        await expect.poll(readStoredToken, { timeout: 5_000 }).toBe('');
        await expect(page.getByLabel(/GitHub Token/)).toHaveValue('');
    });
});
