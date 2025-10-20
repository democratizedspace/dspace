import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageCleared, waitForHydration } from './test-helpers';

async function setCloudGistId(page, gistId) {
    await page.evaluate(async (value) => {
        const updateSnapshot = (snapshot) => {
            const next = snapshot && typeof snapshot === 'object' ? { ...snapshot } : {};
            next.quests = next.quests && typeof next.quests === 'object' ? next.quests : {};
            next.inventory =
                next.inventory && typeof next.inventory === 'object' ? next.inventory : {};
            next.processes =
                next.processes && typeof next.processes === 'object' ? next.processes : {};
            const meta = next._meta && typeof next._meta === 'object' ? next._meta : {};
            meta.lastUpdated = Date.now();
            next._meta = meta;
            next.cloudSync =
                next.cloudSync && typeof next.cloudSync === 'object' ? next.cloudSync : {};
            next.cloudSync.gistId = value;
            return next;
        };

        if (typeof localStorage !== 'undefined') {
            const currentStateRaw = localStorage.getItem('gameState');
            const currentState = currentStateRaw ? JSON.parse(currentStateRaw) : undefined;
            const updatedState = updateSnapshot(currentState);
            localStorage.setItem('gameState', JSON.stringify(updatedState));

            const backupRaw = localStorage.getItem('gameStateBackup');
            if (backupRaw) {
                const backupState = JSON.parse(backupRaw);
                const updatedBackup = updateSnapshot(backupState);
                localStorage.setItem('gameStateBackup', JSON.stringify(updatedBackup));
            }
        }

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
                    const current = updateSnapshot(getReq.result || {});
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

        const tokenField = page.getByLabel(/GitHub Token/i);
        await tokenField.fill(token);
        await page.getByRole('button', { name: /save/i }).click();

        await page.reload();
        await waitForHydration(page);
        await expect(tokenField).toHaveValue(token);

        await setCloudGistId(page, gistId);
        await page.reload();
        await waitForHydration(page);
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue(gistId);

        await page.goto('/settings');
        await waitForHydration(page);
        const logoutButton = page.getByRole('button', { name: /log\s*out/i });
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();

        await expect(page.getByRole('status')).toHaveText('Credentials cleared from this device.');
        await expect(page).toHaveURL(/\/settings\/?$/);
        await expect(page.getByTestId('logout-state')).toHaveText('No saved credentials detected.');
        await expectLocalStorageCleared(page, 'avatarUrl');

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect(page.getByLabel(/GitHub Token/i)).toHaveValue('');
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue('');
    });
});
