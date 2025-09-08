import { test, expect } from '@playwright/test';

test('Authentication flow saves and clears token', async ({ page }) => {
    const token = 'ghp_' + 'a'.repeat(36);
    await page.goto('/cloudsync');

    const tokenInput = page.locator('#token');
    await tokenInput.fill(token);
    await page.getByRole('button', { name: 'Save' }).click();

    const getStoredToken = async () =>
        await page.evaluate(async () => {
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
                try {
                    return await readIDB();
                } catch {
                    /* ignore */
                }
            }

            try {
                return JSON.parse(localStorage.getItem('gameState') || '{}').github?.token || '';
            } catch {
                return '';
            }
        });

    expect(await getStoredToken()).toBe(token);

    await page.reload();
    await page.waitForFunction((t) => document.getElementById('token')?.value === t, token);
    await expect(page.locator('#token')).toHaveValue(token);

    // clear token and verify removal
    await page.getByTestId('clear-sync-token').click();
    await page.waitForFunction(() => document.getElementById('token')?.value === '');
    expect(await getStoredToken()).toBe('');
});
