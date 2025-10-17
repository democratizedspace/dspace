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

        const tokenField = page.getByLabel('GitHub Token*');
        await tokenField.fill(token);
        await page.getByRole('button', { name: /^Save$/i }).click();

        await page.reload();
        await waitForHydration(page);
        await expect(page.getByLabel('GitHub Token*')).toHaveValue(token);

        await setCloudGistId(page, gistId);
        await page.reload();
        await waitForHydration(page);
        await expect(page.getByLabel('Gist ID')).toHaveValue(gistId);

        await page.goto('/settings');
        await waitForHydration(page);
        await expect(page).toHaveURL(/\/settings$/);

        const logoutButton = page.getByRole('button', { name: /log\s*out/i });
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();
        await expect(page.getByRole('status')).toHaveText('Credentials cleared from this device.');
        await expect(page.getByTestId('logout-state')).toHaveText('No saved credentials detected.');
        await expectLocalStorageCleared(page, 'avatarUrl');

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect(page.getByLabel('GitHub Token*')).toHaveValue('');
        await expect(page.getByLabel('Gist ID')).toHaveValue('');
    });
});
