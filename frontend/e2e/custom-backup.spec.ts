import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { clearUserData, waitForHydration } from './test-helpers';

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'backup.json');

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('exports and imports custom content backups', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

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
    });
});
