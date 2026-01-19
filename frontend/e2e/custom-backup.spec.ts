import { test, expect } from '@playwright/test';
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
        page.on('response', (response) => {
            if (response.status() === 404) {
                console.log('E2E 404:', response.url());
            }
        });

        await page.goto('/contentbackup');
        await waitForHydration(page);

        const exportPanel = page.getByTestId('contentbackup-export');
        const importPanel = page.getByTestId('contentbackup-import');
        await expect(exportPanel).toBeVisible();
        await expect(importPanel).toBeVisible();

        const exportBox = await exportPanel.boundingBox();
        const importBox = await importPanel.boundingBox();
        if (!exportBox || !importBox) {
            throw new Error('Expected content backup panels to have layout boxes.');
        }

        const viewportWidth = page.viewportSize()?.width ?? 1280;
        const viewportCenter = viewportWidth / 2;
        const exportCenter = exportBox.x + exportBox.width / 2;
        const importCenter = importBox.x + importBox.width / 2;

        expect(Math.abs(exportCenter - viewportCenter)).toBeLessThanOrEqual(4);
        expect(Math.abs(importCenter - viewportCenter)).toBeLessThanOrEqual(4);
        expect(Math.abs(exportCenter - importCenter)).toBeLessThanOrEqual(4);

        await page.evaluate(async () => {
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open('CustomContent', 3);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('meta')) {
                        db.createObjectStore('meta');
                    }
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
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction(['meta', 'items', 'processes', 'quests'], 'readwrite');
                    tx.objectStore('meta').put(3, 'schemaVersion');
                    tx.objectStore('items').put({
                        id: 'e2e-item',
                        name: 'E2E Item',
                        description: 'backup item',
                        image: 'data:image/png;base64,TEST',
                    });
                    tx.objectStore('processes').put({
                        id: 'e2e-process',
                        title: 'E2E Process',
                        duration: 60,
                    });
                    tx.objectStore('quests').put({
                        id: 'e2e-quest',
                        title: 'E2E Quest',
                        description: 'backup quest',
                        image: 'data:image/png;base64,TEST',
                        custom: true,
                    });
                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                    tx.onerror = () => {
                        db.close();
                        reject(tx.error ?? new Error('seed failed'));
                    };
                };
            });
        });

        const prepareButton = page.getByTestId('contentbackup-prepare');
        await prepareButton.click();
        await expect(prepareButton).toBeDisabled();

        const preparingPreview = page.getByTestId('contentbackup-preparing');
        const preparedPreview = page.getByTestId('contentbackup-prepared');
        const errorPreview = page.getByTestId('contentbackup-error');

        let status: 'preparing' | 'prepared' | 'error';
        try {
            status = await Promise.race([
                preparingPreview
                    .waitFor({ state: 'visible', timeout: 60000 })
                    .then(() => 'preparing'),
                preparedPreview
                    .waitFor({ state: 'visible', timeout: 60000 })
                    .then(() => 'prepared'),
                errorPreview.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'error'),
            ]);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Timed out waiting for content backup to finish preparing within 60s. Last error: ${message}`
            );
        }

        if (status === 'preparing') {
            try {
                status = await Promise.race([
                    preparedPreview
                        .waitFor({ state: 'visible', timeout: 60000 })
                        .then(() => 'prepared'),
                    errorPreview.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'error'),
                ]);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                throw new Error(
                    `Timed out waiting for content backup to finish preparing within 60s. Last error: ${message}`
                );
            }
        }

        if (status === 'error') {
            const errorText = await errorPreview.innerText();
            throw new Error(`Content backup failed during prepare: ${errorText}`);
        }

        await expect(preparedPreview).toContainText('Item: E2E Item');
        await expect(preparedPreview).toContainText('Process: E2E Process');
        await expect(preparedPreview).toContainText('Quest: E2E Quest');

        await expect(page.getByRole('button', { name: /download backup/i })).toBeVisible();

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE_PATH);

        await expect(page.getByRole('status')).toContainText('Import complete');

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
});
