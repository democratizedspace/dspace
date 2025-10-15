import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const manageQuestsHydrationSelector = '.manage-quests[data-hydrated="true"]';

test.describe('Manage Quests', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should list quests on manage page', async ({ page }) => {
        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);
        const quests = page.getByTestId('quest-row');
        await expect(quests.first()).toBeVisible();
    });

    test('should create and delete a custom quest via manage page', async ({ page }) => {
        const questTitle = `Delete Quest ${Date.now()}`;

        // create quest
        await page.goto('/quests/create');
        await page.fill('#title', questTitle);
        await page.fill('#description', 'Quest created for deletion test');
        const submit = page.locator('button.submit-button, input[type="submit"]');
        await submit.click();
        await page.waitForLoadState('networkidle');

        // go to manage page
        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);

        const searchInput = page.getByPlaceholder('Search quests...');
        await searchInput.fill(questTitle);

        const questRow = page.getByTestId('quest-row').filter({ hasText: questTitle }).first();
        await questRow.scrollIntoViewIfNeeded();
        await expect(questRow).toBeVisible();

        // accept confirmation dialog
        page.on('dialog', (d) => d.accept());
        await questRow.locator('.delete-button').click();
        await page.waitForTimeout(500);
        await expect(page.getByTestId('quest-row').filter({ hasText: questTitle })).toHaveCount(0);

        // reload and verify still gone
        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);
        await searchInput.fill(questTitle);
        await expect(page.getByTestId('quest-row').filter({ hasText: questTitle })).toHaveCount(0);

        // check indexeddb
        const exists = await page.evaluate(async (title) => {
            const open = indexedDB.open('CustomContent');
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                open.onsuccess = () => resolve(open.result);
                open.onerror = () => reject(open.error);
                open.onupgradeneeded = () => resolve(open.result);
            });
            const tx = db.transaction('quests', 'readonly');
            const store = tx.objectStore('quests');
            const req = store.getAll();
            const quests = await new Promise<Array<{ title: string }>>((resolve, reject) => {
                req.onsuccess = () => resolve(req.result as Array<{ title: string }>);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return quests.some((q) => q.title === title);
        }, questTitle);

        expect(exists).toBe(false);
    });

    test('should edit a custom quest title', async ({ page }) => {
        const questTitle = `Edit Quest ${Date.now()}`;
        const updatedTitle = questTitle + ' Updated';

        await page.goto('/quests/create');
        await page.fill('#title', questTitle);
        await page.fill('#description', 'Quest to edit');
        await page.click('button.submit-button');
        await page.waitForLoadState('networkidle');

        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);

        const searchInput = page.getByPlaceholder('Search quests...');
        await searchInput.fill(questTitle);

        const questRow = page.getByTestId('quest-row').filter({ hasText: questTitle }).first();
        await questRow.scrollIntoViewIfNeeded();
        await questRow.hover();
        const editButton = questRow.getByTestId('quest-edit-button');
        await expect(editButton).toBeVisible({ timeout: 15000 });
        await expect(editButton).toBeEnabled();
        await editButton.click();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.fill('#title', updatedTitle);
        await page.click('button.submit-button');
        await page.waitForLoadState('networkidle');

        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);
        await searchInput.fill(updatedTitle);
        const updatedRow = page.getByTestId('quest-row').filter({ hasText: updatedTitle }).first();
        await updatedRow.scrollIntoViewIfNeeded();
        await expect(updatedRow).toBeVisible();
    });
});
