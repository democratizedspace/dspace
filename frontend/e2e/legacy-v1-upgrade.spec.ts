import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

import { clearUserData, navigateWithRetry } from './test-helpers';

const __dirname = dirname(fileURLToPath(import.meta.url));
const miscItemsPath = join(__dirname, '../src/pages/inventory/json/items/misc.json');
const miscItems = JSON.parse(readFileSync(miscItemsPath, 'utf-8'));
const earlyAdopterId = miscItems.find((item) => item.name === 'Early Adopter Token')?.id;

const seedV3State = async (page) => {
    await page.evaluate(async () => {
        const state = {
            quests: {},
            inventory: { '3': 5 },
            processes: {},
            settings: { showQuestGraphVisualizer: false },
            _meta: { lastUpdated: Date.now() },
        };

        await new Promise((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
                if (!db.objectStoreNames.contains('backup')) {
                    db.createObjectStore('backup');
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('state', 'readwrite');
                tx.objectStore('state').put(state, 'root');
                tx.oncomplete = () => {
                    db.close();
                    resolve(null);
                };
                tx.onerror = () => {
                    db.close();
                    reject(tx.error);
                };
            };
            request.onerror = () => reject(request.error);
        });
    });
};

const readV3State = async (page) =>
    page.evaluate(async () => {
        const state = await new Promise((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
                if (!db.objectStoreNames.contains('backup')) {
                    db.createObjectStore('backup');
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('state', 'readonly');
                const getReq = tx.objectStore('state').get('root');
                getReq.onsuccess = () => {
                    db.close();
                    resolve(getReq.result);
                };
                getReq.onerror = () => {
                    db.close();
                    reject(getReq.error);
                };
            };
            request.onerror = () => reject(request.error);
        });

        return state;
    });

test.describe('Legacy v1 cookie upgrade', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('detects v1 cookies and merges into v3 inventory', async ({ page }) => {
        expect(earlyAdopterId).toBeTruthy();

        await navigateWithRetry(page, '/settings');
        await seedV3State(page);

        await page.evaluate(() => {
            document.cookie = 'item-3=75; path=/';
            document.cookie = 'item-10=2; path=/';
            document.cookie = 'item-21=20%2B; path=/';
            document.cookie = 'item-83=1; path=/';
            window.dispatchEvent(new CustomEvent('legacy-upgrade-refresh'));
        });

        await expect(page.getByText(/item cookies detected/i)).toBeVisible();
        const mergeButton = page.getByRole('button', { name: /merge v1 into current save/i });
        await expect(mergeButton).toBeEnabled();
        await mergeButton.click();

        await expect(page.getByText('Merged v1 items into your current save.')).toBeVisible();

        const state = await readV3State(page);
        const inventory = state?.inventory ?? {};

        expect(inventory['3']).toBe(80);
        expect(inventory['10']).toBe(2);
        expect(inventory['21']).toBe(20);
        expect(inventory['83']).toBe(1);
        expect(inventory[String(earlyAdopterId)]).toBe(1);
    });
});
