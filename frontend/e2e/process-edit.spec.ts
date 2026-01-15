import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { clearUserData, waitForHydration } from './test-helpers';

const CUSTOM_CONTENT_DB_VERSION = 3;
const SEED_ITEM_ID = '8aa6dc27-dc42-4622-ac88-cbd57f48625f';
const SEED_ITEM_NAME = 'entry-level FDM 3D printer';

async function seedCustomProcess(
    page: import('@playwright/test').Page,
    processRecord: Record<string, unknown>
): Promise<void> {
    await page.evaluate(
        async ({ processRecord, dbVersion }) => {
            const openDatabase = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open('CustomContent', dbVersion);

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
                                new Error('Failed to open IndexedDB for process seeding')
                        );
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDatabase();
            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = db.transaction('processes', 'readwrite');
                    const store = tx.objectStore('processes');
                    const request = store.put(processRecord);

                    tx.oncomplete = () => resolve();
                    tx.onerror = () =>
                        reject(tx.error ?? new Error('Process seed transaction failed'));
                    tx.onabort = () =>
                        reject(tx.error ?? new Error('Process seed transaction aborted'));

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to seed process record'));
                });
            } finally {
                db.close();
            }
        },
        { processRecord, dbVersion: CUSTOM_CONTENT_DB_VERSION }
    );
}

test.describe('Process edit route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads and updates a custom process', async ({ page }) => {
        const processId = randomUUID();
        const initialTitle = `Custom Process ${Date.now()}`;
        const updatedTitle = `${initialTitle} Updated`;

        await page.goto('/');

        await seedCustomProcess(page, {
            id: processId,
            title: initialTitle,
            duration: '45m',
            requireItems: [{ id: SEED_ITEM_ID, count: 2 }],
            consumeItems: [],
            createItems: [],
            custom: true,
            entityType: 'process',
            createdAt: new Date().toISOString(),
        });

        const response = await page.goto(`/processes/${processId}/edit`);
        expect(response?.status()).toBe(200);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const titleInput = page.locator('#title');
        await expect(titleInput).toHaveValue(initialTitle);
        await expect(page.locator('#duration')).toHaveValue('45m');
        await expect(
            page.locator('#required-items-section input[type="number"]').first()
        ).toHaveValue('2');
        await expect(page.getByText(SEED_ITEM_NAME)).toBeVisible();

        await titleInput.fill(updatedTitle);
        const updateButton = page.getByRole('button', { name: 'Update Process' });
        await expect(updateButton).toBeEnabled();
        await Promise.all([page.waitForLoadState('networkidle'), updateButton.click()]);
        await expect(page.getByRole('status')).toContainText('Process updated successfully');

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.locator('#title')).toHaveValue(updatedTitle);

        await page.goto(`/processes/${processId}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByRole('heading', { level: 3 })).toContainText(updatedTitle);
    });
});
