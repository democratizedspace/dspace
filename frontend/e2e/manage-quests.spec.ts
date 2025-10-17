import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration, expectQuestIndexedDbState } from './test-helpers';

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
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await page.getByLabel(/Title/).fill(questTitle);
        await page.getByLabel(/Description/).fill('Quest created for deletion test');
        const createQuestButton = page.getByRole('button', { name: 'Create Quest' });
        await expect(createQuestButton).toBeEnabled();
        await Promise.all([page.waitForLoadState('networkidle'), createQuestButton.click()]);
        const creationStatus = page.getByRole('status');
        await expect(creationStatus).toContainText('Quest created successfully');
        await expect(page.getByRole('link', { name: 'View quest' })).toBeVisible();
        await expectQuestIndexedDbState(page, questTitle, { present: true });

        // go to manage page
        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);

        const searchInput = page.getByPlaceholder('Search quests...');
        await searchInput.fill(questTitle);

        const questRows = page.getByTestId('quest-row').filter({ hasText: questTitle });
        await expect(questRows).toHaveCount(1);
        const deleteButton = questRows.getByRole('button', { name: 'Delete' }).first();
        await expect(deleteButton).toBeVisible();

        // accept confirmation dialog
        page.once('dialog', async (dialog) => {
            expect(dialog.type()).toBe('confirm');
            await dialog.accept();
        });
        await deleteButton.click();
        await expect(questRows).toHaveCount(0);
        await expectQuestIndexedDbState(page, questTitle, { present: false });

        // reload and verify still gone
        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);
        await searchInput.fill(questTitle);
        await expect(page.getByTestId('quest-row').filter({ hasText: questTitle })).toHaveCount(0);
    });

    test('should edit a custom quest title', async ({ page }) => {
        const questTitle = `Edit Quest ${Date.now()}`;
        const updatedTitle = questTitle + ' Updated';

        await page.goto('/quests/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await page.getByLabel(/Title/).fill(questTitle);
        await page.getByLabel(/Description/).fill('Quest to edit');
        await Promise.all([
            page.waitForLoadState('networkidle'),
            page.getByRole('button', { name: 'Create Quest' }).click(),
        ]);
        await expect(page.getByRole('status')).toContainText('Quest created successfully');
        await expectQuestIndexedDbState(page, questTitle, { present: true });

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

        const titleInput = page.getByLabel(/Title/);
        await titleInput.fill(updatedTitle);
        const updateButton = page.getByRole('button', { name: 'Update Quest' });
        await expect(updateButton).toBeEnabled();
        await Promise.all([page.waitForLoadState('networkidle'), updateButton.click()]);
        await expect(page.getByRole('status')).toContainText('Quest updated successfully');
        await expectQuestIndexedDbState(page, updatedTitle, { present: true });

        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);
        await searchInput.fill(updatedTitle);
        const updatedRow = page.getByTestId('quest-row').filter({ hasText: updatedTitle }).first();
        await updatedRow.scrollIntoViewIfNeeded();
        await expect(updatedRow).toBeVisible();
    });
});
