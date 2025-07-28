import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration, fillProcessForm } from './test-helpers';

test.describe('Manage Processes', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should list processes on manage page', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const rows = page.locator('.process-row');
        await expect(rows.first()).toBeVisible();
    });

    test('should create and delete a custom process via manage page', async ({ page }) => {
        const title = `Delete Process ${Date.now()}`;

        await page.goto('/processes/create');
        await fillProcessForm(page, title, '1m', 0, 0, 0);
        const submit = page.locator('button.submit-button');
        await submit.click();
        await page.waitForLoadState('networkidle');

        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const row = page.locator('.process-row', { hasText: title }).first();
        await expect(row).toBeVisible();

        page.on('dialog', (d) => d.accept());
        await row.locator('.delete-button').click();
        await page.waitForTimeout(500);
        await expect(page.locator(`text="${title}"`)).toHaveCount(0);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.locator(`text="${title}"`)).toHaveCount(0);

        const exists = await page.evaluate(async (processTitle) => {
            const openReq = indexedDB.open('CustomContent');
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                openReq.onsuccess = () => resolve(openReq.result);
                openReq.onerror = () => reject(openReq.error);
                openReq.onupgradeneeded = () => resolve(openReq.result);
            });
            const tx = db.transaction('processes', 'readonly');
            const store = tx.objectStore('processes');
            const req = store.getAll();
            const processes = await new Promise<Array<{ title: string }>>((resolve, reject) => {
                req.onsuccess = () => resolve(req.result as Array<{ title: string }>);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return processes.some((p) => p.title === processTitle);
        }, title);

        expect(exists).toBe(false);
    });

    test('should preview a custom process', async ({ page }) => {
        const title = `Preview Process ${Date.now()}`;

        await page.goto('/processes/create');
        await fillProcessForm(page, title, '1m', 0, 0, 0);
        const submit = page.locator('button.submit-button');
        await submit.click();
        await page.waitForLoadState('networkidle');

        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const row = page.locator('.process-row', { hasText: title }).first();
        await expect(row).toBeVisible();
        await row.locator('.preview-button').click();
        await expect(row.locator('.process-preview')).toBeVisible();
    });
});
