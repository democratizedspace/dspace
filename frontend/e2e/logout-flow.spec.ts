import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

async function setCloudGistId(page, gistId) {
    await page.evaluate(async (value) => {
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
        await page.fill('#token', token);
        await page.getByRole('button', { name: 'Save' }).click();

        await page.reload();
        await page.waitForSelector('#token');
        await expect(page.locator('#token')).toHaveValue(token);

        await setCloudGistId(page, gistId);
        await page.reload();
        await page.waitForSelector('#gist');
        await expect(page.locator('#gist')).toHaveValue(gistId);

        await page.goto('/settings');
        const logoutButton = page.getByRole('button', { name: 'Log out' });
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();
        await expect(page.getByRole('status')).toHaveText('Credentials cleared from this device.');

        await page.goto('/cloudsync');
        await page.waitForSelector('#token');
        await expect(page.locator('#token')).toHaveValue('');
        await expect(page.locator('#gist')).toHaveValue('');
    });
});
