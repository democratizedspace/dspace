import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';

const FIXTURE_DIR = path.dirname(fileURLToPath(import.meta.url));
const VALID_BACKUP_PATH = path.join(FIXTURE_DIR, 'fixtures', 'backup.json');
const INVALID_BACKUP_PATH = path.join(FIXTURE_DIR, 'fixtures', 'invalid-backup.json');

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('exports custom content backups with progress and download', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        await page.evaluate(async () => {
            const request = indexedDB.open('CustomContent');
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                request.onerror = () => reject(request.error ?? new Error('open failed'));
                request.onsuccess = () => resolve(request.result);
            });

            try {
                const tx = db.transaction('items', 'readwrite');
                const store = tx.objectStore('items');
                store.put({
                    id: 'ci-export-item',
                    name: 'Export Item',
                    description: 'Seed data for export test',
                    image: 'data:image/png;base64,iVBORw0KGgo=',
                    custom: true,
                });

                await new Promise<void>((resolve, reject) => {
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error ?? new Error('transaction failed'));
                });
            } finally {
                db.close();
            }
        });

        const prepareButton = page.getByRole('button', { name: /prepare backup/i });
        await expect(prepareButton).toBeVisible();
        await prepareButton.click();

        await expect(page.getByRole('progressbar')).toHaveCount(2);

        const downloadButton = page.getByRole('button', { name: /download backup/i });
        await expect(downloadButton).toBeVisible();
    });

    test('imports custom content backups from file upload', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        const fileInput = page.getByLabel('Upload custom content backup');
        await fileInput.setInputFiles(VALID_BACKUP_PATH);

        await expect(page.getByRole('status')).toHaveText(/Imported 1 items/i);

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

    test('rejects invalid backup files without applying changes', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        const fileInput = page.getByLabel('Upload custom content backup');
        await fileInput.setInputFiles(INVALID_BACKUP_PATH);

        await expect(page.getByRole('alert')).toHaveText(
            /unsupported custom content backup schema version/i
        );

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
                            return true;
                        }

                        return await new Promise<boolean>((resolve, reject) => {
                            const tx = db.transaction('items', 'readonly');
                            const store = tx.objectStore('items');
                            const getRequest = store.get('ci-item-e2e');
                            getRequest.onerror = () =>
                                reject(getRequest.error ?? new Error('read failed'));
                            getRequest.onsuccess = () => resolve(!getRequest.result);
                        });
                    } finally {
                        db.close();
                    }
                })
            )
            .toBe(true);
    });
});
