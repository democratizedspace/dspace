import { test, expect } from '@playwright/test';
import { flushGameStateWrites, registerClientStateHooks, waitForHydration } from './test-helpers';

registerClientStateHooks(test);

test('Authentication flow saves and clears token', async ({ page }) => {
    await page.route('**/gists?per_page=1', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    const token = 'ghp_' + 'a'.repeat(36);
    await page.goto('/cloudsync');
    await waitForHydration(page);

    const tokenInput = page.getByLabel(/GitHub Token/i);
    await tokenInput.fill(token);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('sync-success')).toHaveText(/Token saved and validated/i);

    const getStoredToken = async () =>
        page.evaluate(async () => {
            async function readIDB() {
                return await new Promise((resolve) => {
                    const req = indexedDB.open('dspaceGameState');
                    req.onerror = () => resolve('');
                    req.onsuccess = () => {
                        const tx = req.result.transaction('state', 'readonly');
                        const getReq = tx.objectStore('state').get('root');
                        getReq.onerror = () => resolve('');
                        getReq.onsuccess = () => resolve(getReq.result?.github?.token || '');
                    };
                });
            }

            if ('indexedDB' in window) {
                const { indexedDB } = window;
                if (indexedDB && typeof indexedDB.open === 'function') {
                    try {
                        return await readIDB();
                    } catch {
                        /* ignore */
                    }
                }
            }

            try {
                return JSON.parse(localStorage.getItem('gameState') || '{}').github?.token || '';
            } catch {
                return '';
            }
        });

    await flushGameStateWrites(page);
    await expect.poll(getStoredToken, { timeout: 30_000 }).toBe(token);

    await page.reload();
    await waitForHydration(page);
    await expect(tokenInput).toHaveValue(token);

    // clear token and verify removal
    await page.getByTestId('clear-sync-token').click();
    await expect(tokenInput).toHaveValue('');
    await flushGameStateWrites(page);
    await expect.poll(getStoredToken, { timeout: 30_000 }).toBe('');
});
