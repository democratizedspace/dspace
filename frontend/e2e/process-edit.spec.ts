import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
    clearUserData,
    seedCustomProcess,
    waitForHydration,
    type CustomProcessRecord,
} from './test-helpers';

test.describe('Process edit route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders edit form with prefilled data and persists updates', async ({ page }) => {
        const processId = randomUUID();
        const initialTitle = `Custom Process ${Date.now()}`;
        const updatedTitle = `${initialTitle} Updated`;

        const processRecord: CustomProcessRecord = {
            id: processId,
            title: initialTitle,
            duration: '1h',
            requireItems: [
                {
                    id: '8aa6dc27-dc42-4622-ac88-cbd57f48625f',
                    count: 2,
                },
            ],
            consumeItems: [],
            createItems: [],
            custom: true,
            extraField: 'preserve-me',
        };

        await seedCustomProcess(page, processRecord);

        await page.goto(`/processes/${processId}/edit`);
        await waitForHydration(page, '.process-form');

        await expect(page.locator('text=Page not found.')).toHaveCount(0);

        const titleInput = page.locator('#title');
        const durationInput = page.locator('#duration');
        const requiredCountInput = page.locator('#required-items-section input[type="number"]');

        await expect(titleInput).toHaveValue(initialTitle);
        await expect(durationInput).toHaveValue('1h');
        await expect(requiredCountInput).toHaveValue('2');

        await titleInput.fill(updatedTitle);
        await durationInput.fill('2h');

        await page.click('button.submit-button');
        await expect(page.locator('.success-message')).toContainText(
            'Process updated successfully'
        );

        await page.goto(`/processes/${processId}/edit`);
        await waitForHydration(page, '.process-form');
        await expect(page.locator('#title')).toHaveValue(updatedTitle);

        await page.goto(`/processes/${processId}`);
        await waitForHydration(page);
        await expect(page.locator('h3')).toContainText(updatedTitle);

        const updatedRecord = await page.evaluate(async (id) => {
            const openDatabase = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
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

                    request.onerror = () =>
                        reject(
                            request.error ??
                                new Error('Failed to open IndexedDB database "CustomContent"')
                        );
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDatabase();

            try {
                return await new Promise<Record<string, unknown> | null>((resolve, reject) => {
                    const tx = db.transaction('processes', 'readonly');
                    const store = tx.objectStore('processes');
                    const request = store.get(id);

                    request.onsuccess = () => resolve(request.result ?? null);
                    request.onerror = () => reject(request.error);
                });
            } finally {
                db.close();
            }
        }, processId);

        expect(updatedRecord?.id).toBe(processId);
        expect(updatedRecord?.title).toBe(updatedTitle);
        expect(updatedRecord?.extraField).toBe('preserve-me');
    });
});
