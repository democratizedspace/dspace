import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageCleared, waitForHydration } from './test-helpers';

async function setCloudGistId(page, gistId) {
    await page.evaluate(async (value) => {
        if (typeof indexedDB === 'undefined') {
            return;
        }
        await new Promise((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('state', 'readwrite');
                const store = tx.objectStore('state');
                const getReq = store.get('root');
                getReq.onerror = () =>
                    reject(getReq.error || new Error('Failed to load game state'));
                getReq.onsuccess = () => {
                    const current = getReq.result || {};
                    current.cloudSync = current.cloudSync || {};
                    current.cloudSync.gistId = value;
                    store.put(current, 'root');
                };
                tx.oncomplete = () => resolve(undefined);
                tx.onerror = () => reject(tx.error || new Error('Failed to save game state'));
            };
        });
    }, gistId);
}

test.describe('Logout flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('clears saved credentials from settings', async ({ page }) => {
        const token = 'ghp_' + 'a'.repeat(36);
        const gistId = 'gist1234567890';

        await page.goto('/cloudsync');
        await waitForHydration(page);

        const tokenInput = page.getByLabel(/GitHub Token/i);
        await tokenInput.fill(token);
        await page.getByRole('button', { name: /save/i }).click();
        await expect(tokenInput).toHaveValue(token);

        await setCloudGistId(page, gistId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForHydration(page);

        const gistInput = page.getByLabel(/Gist ID/i);
        await expect(gistInput).toHaveValue(gistId);

        await page.goto('/settings');
        await waitForHydration(page);

        const logoutButton = page.getByRole('button', { name: /log out/i });
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();

        await expect(page).toHaveURL(/\/settings$/);
        await expect(page.getByRole('status')).toHaveText('Credentials cleared from this device.');
        await expect(page.getByTestId('logout-state')).toHaveText('No saved credentials detected.');

        await expectLocalStorageCleared(page, 'avatarUrl');

        await expect
            .poll(async () => {
                const state = await page.evaluate(async () => {
                    return new Promise((resolve) => {
                        const request = indexedDB.open('dspaceGameState');
                        request.onerror = () => resolve(null);
                        request.onsuccess = () => {
                            const db = request.result;
                            const tx = db.transaction('state', 'readonly');
                            const store = tx.objectStore('state');
                            const getReq = store.get('root');
                            getReq.onerror = () => {
                                db.close();
                                resolve(null);
                            };
                            getReq.onsuccess = () => {
                                const result = getReq.result || {};
                                db.close();
                                resolve(result);
                            };
                        };
                    });
                });
                if (!state) {
                    return 'pending';
                }
                const tokenValue = state.github?.token ?? '';
                const gistValue = state.cloudSync?.gistId ?? '';
                return `${tokenValue}|${gistValue}`;
            })
            .toBe('|');

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect(page.getByLabel(/GitHub Token/i)).toHaveValue('');
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue('');
    });
});
