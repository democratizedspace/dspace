import { test, expect } from '@playwright/test';
import path from 'path';
import { readFileSync } from 'fs';
import { clearUserData, waitForHydration } from './test-helpers';

const __dirname = path.dirname(__filename);

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('imports a backup string and persists entities', async ({ page }) => {
        const backupPath = path.join(__dirname, 'fixtures', 'backup.json');
        const backupPayload = JSON.parse(readFileSync(backupPath, 'utf-8')) as {
            backup: string;
        };
        const backupString = backupPayload.backup.trim();

        await page.goto('/contentbackup');
        await waitForHydration(page);

        await expect(page.getByText('Custom content backup string:')).toBeVisible();
        await expect(page.getByRole('button', { name: /Copy/i })).toBeVisible();

        await page.getByTestId('custom-backup-input').fill(backupString);
        await page.getByRole('button', { name: /^Import$/i }).click();

        const readStoreValue = (storeName: string, key: string) =>
            page.evaluate(
                async ({ store, entityKey }) => {
                    const openRequest = indexedDB.open('CustomContent');
                    const db: IDBDatabase = await new Promise((resolve, reject) => {
                        openRequest.onsuccess = () => resolve(openRequest.result);
                        openRequest.onerror = () => reject(openRequest.error);
                    });

                    try {
                        const tx = db.transaction(store, 'readonly');
                        const request = tx.objectStore(store).get(entityKey);
                        const record = await new Promise<unknown>((resolve, reject) => {
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });

                        return record as Record<string, unknown> | undefined;
                    } finally {
                        db.close();
                    }
                },
                { store: storeName, entityKey: key }
            );

        await expect
            .poll(async () => (await readStoreValue('items', 'fixture-item-1'))?.name)
            .toBe('Fixture Item');
        await expect
            .poll(async () => (await readStoreValue('processes', 'fixture-process-1'))?.title)
            .toBe('Fixture Process');
        await expect
            .poll(async () => (await readStoreValue('quests', 'fixture-quest-1'))?.title)
            .toBe('Fixture Quest');
    });
});
