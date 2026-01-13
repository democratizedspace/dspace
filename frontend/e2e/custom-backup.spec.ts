import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';

const FIXTURE_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixtures', 'backup.json');
const INVALID_FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixtures', 'backup-invalid.json');

const IMAGE_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8/5+hHgAGgwJ/l4FfPwAAAABJRU5ErkJggg==';

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('exports and imports custom content backups', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        await page.evaluate(async (imageDataUrl) => {
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open('CustomContent', 3);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('items')) {
                        db.createObjectStore('items', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('processes')) {
                        db.createObjectStore('processes', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('quests')) {
                        db.createObjectStore('quests', { keyPath: 'id' });
                    }
                };
                request.onerror = () => reject(request.error ?? new Error('open failed'));
                request.onsuccess = () => resolve();
            });

            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open('CustomContent', 3);
                request.onerror = () => reject(request.error ?? new Error('open failed'));
                request.onsuccess = () => resolve(request.result);
            });

            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = db.transaction(['items', 'processes', 'quests'], 'readwrite');
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error ?? new Error('write failed'));
                    tx.objectStore('items').put({
                        id: 'export-item',
                        name: 'Export Item',
                        description: 'Exported item',
                        image: imageDataUrl,
                        custom: true,
                    });
                    tx.objectStore('processes').put({
                        id: 'export-process',
                        title: 'Export Process',
                        custom: true,
                    });
                    tx.objectStore('quests').put({
                        id: 'export-quest',
                        title: 'Export Quest',
                        description: 'Exported quest',
                        image: imageDataUrl,
                        custom: true,
                    });
                });
            } finally {
                db.close();
            }
        }, IMAGE_DATA_URL);

        const prepareButton = page.getByRole('button', { name: /prepare backup/i });
        await expect(prepareButton).toBeEnabled();
        await prepareButton.click();

        await expect(page.getByText('Item: Export Item')).toBeVisible();
        await expect(page.getByText('Quest image: Export Quest')).toBeVisible();

        const downloadButton = page.getByRole('button', { name: /download backup/i });
        await expect(downloadButton).toBeVisible();

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            downloadButton.click(),
        ]);
        expect(download.suggestedFilename()).toMatch(
            /dspace-custom-content-backup-\d{8}-\d{6}\.json/
        );

        const importInput = page.locator('input[type="file"]');
        await importInput.setInputFiles(FIXTURE_PATH);
        await expect(page.getByText(/import complete/i)).toBeVisible();

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
    });

    test('shows an error for invalid backups without importing data', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        const importInput = page.locator('input[type="file"]');
        await importInput.setInputFiles(INVALID_FIXTURE_PATH);

        await expect(page.getByRole('alert')).toContainText('Unsupported backup schema version');

        const hasItems = await page.evaluate(async () => {
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
                    const getRequest = store.getAll();
                    getRequest.onerror = () => reject(getRequest.error ?? new Error('read failed'));
                    getRequest.onsuccess = () => resolve(getRequest.result.length > 0);
                });
            } finally {
                db.close();
            }
        });

        expect(hasItems).toBe(false);
    });
});
