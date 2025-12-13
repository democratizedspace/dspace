import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageCleared, waitForHydration } from './test-helpers';

async function setCloudGistId(page, gistId) {
    await page.evaluate(async (value) => {
        const parseSnapshot = (raw) => {
            if (!raw) {
                return {};
            }
            try {
                return JSON.parse(raw);
            } catch (err) {
                console.warn('Failed to parse stored game state snapshot', err);
                return {};
            }
        };

        const applyUpdate = (snapshot) => {
            const state = snapshot && typeof snapshot === 'object' ? snapshot : {};
            state.cloudSync = state.cloudSync || {};
            state.cloudSync.gistId = value;
            state._meta = state._meta && typeof state._meta === 'object' ? state._meta : {};
            state._meta.lastUpdated = Date.now();
            return state;
        };

        const updateLocalStorage = (state) => {
            if (typeof localStorage === 'undefined') {
                return;
            }
            try {
                const serialized = JSON.stringify(state);
                localStorage.setItem('gameState', serialized);
                localStorage.setItem('gameStateBackup', serialized);
            } catch (err) {
                console.warn('Failed to update localStorage gist id', err);
            }
        };

        if (typeof indexedDB === 'undefined') {
            const fallbackRaw =
                typeof localStorage !== 'undefined' ? localStorage.getItem('gameState') : null;
            const fallbackState = applyUpdate(parseSnapshot(fallbackRaw));
            updateLocalStorage(fallbackState);
            return;
        }

        let updatedState;
        await new Promise((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
            };
            request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('state', 'readwrite');
                const store = tx.objectStore('state');
                tx.onerror = () => reject(tx.error || new Error('Failed to save game state'));
                tx.oncomplete = () => resolve(undefined);
                const getReq = store.get('root');
                getReq.onerror = () =>
                    reject(getReq.error || new Error('Failed to load game state'));
                getReq.onsuccess = () => {
                    updatedState = applyUpdate(getReq.result || {});
                    store.put(updatedState, 'root');
                };
            };
        }).catch((err) => {
            console.warn('Failed to persist gist id to IndexedDB', err);
        });

        if (!updatedState) {
            const fallbackRaw =
                typeof localStorage !== 'undefined' ? localStorage.getItem('gameState') : null;
            updatedState = applyUpdate(parseSnapshot(fallbackRaw));
        }

        updateLocalStorage(updatedState);
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
        await expect
            .poll(async () =>
                page.evaluate(() => {
                    try {
                        const raw = localStorage.getItem('gameState');
                        if (!raw) {
                            return '';
                        }
                        const parsed = JSON.parse(raw);
                        return parsed.cloudSync?.gistId ?? '';
                    } catch (err) {
                        console.warn('Failed to verify stored gist id', err);
                        return '';
                    }
                })
            )
            .toBe(gistId);
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
