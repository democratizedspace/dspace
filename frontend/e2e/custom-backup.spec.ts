import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';

const FIXTURE_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixtures', 'backup.json');

const seedCustomItem = async (page) => {
    await page.evaluate(async () => {
        const request = indexedDB.open('CustomContent');
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onerror = () => reject(request.error ?? new Error('open failed'));
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => {
                const dbInstance = request.result;
                if (!dbInstance.objectStoreNames.contains('items')) {
                    dbInstance.createObjectStore('items', { keyPath: 'id' });
                }
                if (!dbInstance.objectStoreNames.contains('processes')) {
                    dbInstance.createObjectStore('processes', { keyPath: 'id' });
                }
                if (!dbInstance.objectStoreNames.contains('quests')) {
                    dbInstance.createObjectStore('quests', { keyPath: 'id' });
                }
            };
        });

        try {
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction('items', 'readwrite');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error ?? new Error('transaction failed'));
                tx.objectStore('items').put({
                    id: 'export-item-e2e',
                    name: 'Export Item',
                    custom: true,
                    image: 'data:image/png;base64,EXPORT',
                });
            });
        } finally {
            db.close();
        }
    });
};

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('exports and imports custom content backups', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        await seedCustomItem(page);
        await page.reload();
        await waitForHydration(page);

        await page.getByRole('button', { name: /prepare backup/i }).click();
        await expect(page.getByText('Preparing backup…')).toBeVisible();
        await expect(page.getByText(/Item: Export Item/)).toBeVisible();
        await expect(page.getByText(/Item image: export-item-e2e/i)).toBeVisible();

        const downloadButton = page.getByRole('button', { name: /download backup/i });
        await expect(downloadButton).toBeVisible();

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            downloadButton.click(),
        ]);
        expect(download.suggestedFilename()).toMatch(/dspace-custom-content-backup/);

        const uploadInput = page.locator('input[type="file"]');
        await uploadInput.setInputFiles(FIXTURE_PATH);

        await expect(page.getByText('Importing backup…')).toBeVisible();
        await expect(page.getByText(/Custom content restored successfully/i)).toBeVisible();

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

    test('shows import errors for invalid backup files', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        const uploadInput = page.locator('input[type="file"]');
        await uploadInput.setInputFiles({
            name: 'invalid.json',
            mimeType: 'application/json',
            buffer: Buffer.from('not json'),
        });

        await expect(page.getByRole('alert')).toHaveText(/Invalid backup file/i);
    });
});
