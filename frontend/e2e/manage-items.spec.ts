import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Items', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should list items on manage page', async ({ page }) => {
        await page.goto('/inventory/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const items = page.locator('.item-row');
        await expect(items.first()).toBeVisible();
    });

    test('should create and delete a custom item via manage page', async ({ page }) => {
        const itemName = `Delete Item ${Date.now()}`;

        await page.goto('/inventory/create');
        await page.fill('#name', itemName);
        await page.fill('#description', 'Item created for deletion test');
        await page.fill('#price', '10');
        const submit = page.locator('button.submit-button, input[type="submit"]');
        await submit.click();
        await page.waitForLoadState('networkidle');

        await page.goto('/inventory/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const itemRow = page.locator('.item-row', { hasText: itemName }).first();
        await expect(itemRow).toBeVisible();

        page.on('dialog', (d) => d.accept());
        await itemRow.locator('.delete-button').click();
        await page.waitForTimeout(500);
        await expect(page.locator(`text="${itemName}"`)).toHaveCount(0);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.locator(`text="${itemName}"`)).toHaveCount(0);

        const exists = await page.evaluate(async (name) => {
            const openReq = indexedDB.open('CustomContent');
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                openReq.onsuccess = () => resolve(openReq.result);
                openReq.onerror = () => reject(openReq.error);
                openReq.onupgradeneeded = () => resolve(openReq.result);
            });
            const tx = db.transaction('items', 'readonly');
            const store = tx.objectStore('items');
            const req = store.getAll();
            const items = await new Promise<Array<{ name: string }>>((resolve, reject) => {
                req.onsuccess = () => resolve(req.result as Array<{ name: string }>);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return items.some((i) => i.name === name);
        }, itemName);

        expect(exists).toBe(false);
    });

    test('should preview a custom item', async ({ page }) => {
        const name = `Preview Item ${Date.now()}`;

        await page.goto('/inventory/create');
        await page.fill('#name', name);
        await page.fill('#description', 'Preview desc');
        const submit = page.locator('button.submit-button, input[type="submit"]');
        await submit.click();
        await page.waitForLoadState('networkidle');

        await page.goto('/inventory/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const row = page.locator('.item-row', { hasText: name }).first();
        await expect(row).toBeVisible();
        await row.locator('.preview-button').click();
        await expect(row.locator('.item-preview')).toBeVisible();
    });
});
