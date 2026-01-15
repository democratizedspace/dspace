import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const ITEM_ID = '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6';

type SeedProcessRecord = {
    id: string;
    title: string;
    duration: string;
    requireItems: Array<{ id: string; count: number }>;
    consumeItems: Array<{ id: string; count: number }>;
    createItems: Array<{ id: string; count: number }>;
    custom: boolean;
};

async function seedCustomProcess(page: Page, processRecord: SeedProcessRecord): Promise<void> {
    await page.evaluate(async (record) => {
        await new Promise((resolve, reject) => {
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
                const metaStore = request.transaction.objectStore('meta');
                metaStore.put(3, 'schemaVersion');
            };

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('processes', 'readwrite');
                const store = tx.objectStore('processes');
                store.put(record);
                tx.oncomplete = () => {
                    db.close();
                    resolve(undefined);
                };
                tx.onerror = () => {
                    db.close();
                    reject(tx.error);
                };
            };
        });
    }, processRecord);
}

test.describe('Process edit route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads and updates a custom process via /processes/:id/edit', async ({ page }) => {
        const processId = `process-${Date.now()}`;
        const processTitle = `Editable Process ${Date.now()}`;
        const updatedTitle = `${processTitle} Updated`;

        await seedCustomProcess(page, {
            id: processId,
            title: processTitle,
            duration: '1h',
            requireItems: [{ id: ITEM_ID, count: 1 }],
            consumeItems: [],
            createItems: [],
            custom: true,
        });

        await page.goto(`/processes/${processId}/edit`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const titleInput = page.locator('#title');
        const durationInput = page.locator('#duration');

        await expect(titleInput).toHaveValue(processTitle);
        await expect(durationInput).toHaveValue('1h');
        await expect(page.locator('.item-row')).toHaveCount(1);

        await titleInput.fill(updatedTitle);

        const updateButton = page.getByRole('button', { name: 'Update Process' });
        await expect(updateButton).toBeEnabled();
        await updateButton.click();

        await expect(page.getByRole('status')).toContainText('Process updated successfully');

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.locator('#title')).toHaveValue(updatedTitle);
    });
});
