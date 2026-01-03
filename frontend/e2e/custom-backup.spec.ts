import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';

const FIXTURE_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixtures', 'backup.json');

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('exports and imports custom content backups', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        const mainSaveSnapshot = {
            inventory: { items: { 'sentinel-stabilizer': { quantity: 1 } } },
            _meta: { lastUpdated: Date.now() },
        };

        await page.evaluate(async (state) => {
            const openRequest = indexedDB.open('dspaceGameState', 1);
            const db: IDBDatabase = await new Promise((resolve, reject) => {
                openRequest.onupgradeneeded = () => {
                    const database = openRequest.result;
                    if (!database.objectStoreNames.contains('state')) {
                        database.createObjectStore('state');
                    }
                    if (!database.objectStoreNames.contains('backup')) {
                        database.createObjectStore('backup');
                    }
                };
                openRequest.onsuccess = () => resolve(openRequest.result);
                openRequest.onerror = () => reject(openRequest.error ?? new Error('open failed'));
            });

            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction(['state'], 'readwrite');
                tx.objectStore('state').put(state, 'root');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error ?? new Error('write failed'));
            });

            localStorage.setItem('gameState', JSON.stringify(state));
            db.close();
        }, mainSaveSnapshot);

        const exporter = page.locator('code');
        await expect(exporter).toBeVisible();
        await expect(exporter).not.toHaveText(/^\s*$/);
        await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();

        const importTextarea = page.getByRole('textbox', {
            name: /paste your custom content backup here/i,
        });
        await expect(importTextarea).toBeVisible();

        const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf-8');
        const base64Payload = Buffer.from(fixtureRaw).toString('base64');

        await importTextarea.fill(base64Payload);
        await expect(importTextarea).toHaveValue(base64Payload);

        await page.getByRole('button', { name: /import/i }).click();

        await expect
            .poll(() =>
                page.evaluate(async () => {
                    const request = indexedDB.open('CustomContent');
                    const db = await new Promise<IDBDatabase>((resolve, reject) => {
                        request.onerror = () => reject(request.error ?? new Error('open failed'));
                        request.onsuccess = () => resolve(request.result);
                    });

                    try {
                        if (!db.objectStoreNames.contains('items')) {
                            return false;
                        }

                        return await new Promise<boolean>((resolve, reject) => {
                            const tx = db.transaction('items', 'readonly');
                            const store = tx.objectStore('items');
                            const getRequest = store.get('ci-item-e2e');
                            getRequest.onerror = () =>
                                reject(getRequest.error ?? new Error('read failed'));
                            getRequest.onsuccess = () => resolve(Boolean(getRequest.result));
                        });
                    } finally {
                        db.close();
                    }
                })
            )
            .toBe(true);

        const persistedState = await page.evaluate(async () => {
            const idbState = await new Promise<unknown>((resolve) => {
                const request = indexedDB.open('dspaceGameState', 1);
                request.onupgradeneeded = () => {
                    const database = request.result;
                    if (!database.objectStoreNames.contains('state')) {
                        database.createObjectStore('state');
                    }
                };
                request.onerror = () => resolve(undefined);
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction(['state'], 'readonly');
                    const store = tx.objectStore('state');
                    const get = store.get('root');
                    get.onsuccess = () => resolve(get.result ?? undefined);
                    get.onerror = () => resolve(undefined);
                    tx.oncomplete = () => db.close();
                    tx.onerror = () => db.close();
                };
            });

            return {
                localState: localStorage.getItem('gameState'),
                idbState,
            };
        });

        const parsedLocalState = persistedState.localState
            ? JSON.parse(persistedState.localState)
            : null;

        expect(parsedLocalState?.inventory?.items?.['sentinel-stabilizer']?.quantity).toBe(1);
        expect(
            (persistedState.idbState as Record<string, unknown> | undefined)?.inventory?.items?.[
                'sentinel-stabilizer'
            ]?.quantity
        ).toBe(1);
    });
});
