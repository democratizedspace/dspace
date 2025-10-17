import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';

import { clearUserData, waitForHydration } from './test-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFixturePath = path.resolve(__dirname, 'fixtures/backup.json');
const backupFixture = JSON.parse(fs.readFileSync(backupFixturePath, 'utf8'));
const backupImportString = Buffer.from(JSON.stringify(backupFixture)).toString('base64');

const IMPORTED_ITEM_ID = backupFixture.items[0]?.id ?? 'fixture-item';

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('exports and imports a custom content backup string', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);

        const backupCode = page.locator('code');
        await expect
            .poll(async () => (await backupCode.first().textContent())?.trim() ?? '')
            .not.toBe('');

        const copyButton = page.getByRole('button', { name: /copy/i });
        await expect(copyButton).toBeVisible();

        const importTextarea = page.getByRole('textbox');
        await importTextarea.fill(backupImportString);
        await page.getByRole('button', { name: /import/i }).click();

        await expect
            .poll(async () =>
                page.evaluate(async (itemId: string) => {
                    return new Promise((resolve) => {
                        const request = indexedDB.open('CustomContent');
                        request.onerror = () => resolve(false);
                        request.onsuccess = () => {
                            const db = request.result;
                            if (!db.objectStoreNames.contains('items')) {
                                db.close();
                                resolve(false);
                                return;
                            }
                            const tx = db.transaction('items', 'readonly');
                            const store = tx.objectStore('items');
                            const getAll = store.getAll();
                            getAll.onerror = () => {
                                db.close();
                                resolve(false);
                            };
                            getAll.onsuccess = () => {
                                const items = Array.isArray(getAll.result) ? getAll.result : [];
                                const found = items.some((item) => item?.id === itemId);
                                db.close();
                                resolve(found);
                            };
                        };
                    });
                }, IMPORTED_ITEM_ID)
            )
            .toBe(true);
    });
});
