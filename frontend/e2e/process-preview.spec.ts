import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Process preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('reveals and hides process details from the manage view', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const firstRow = page.locator('.process-row').first();
        await expect(firstRow).toBeVisible();

        const previewButton = firstRow.locator('.preview-button');
        const rowTitle = await firstRow.locator('h3').first().textContent();

        await previewButton.click();

        const preview = firstRow.locator('.process-preview');
        await expect(preview).toBeVisible();
        if (rowTitle) {
            await expect(preview.locator('h3')).toHaveText(rowTitle.trim());
        }
        await expect(preview).toContainText('Duration:');
        await expect(preview.locator('li')).not.toHaveCount(0);

        await previewButton.click();
        await expect(preview).toBeHidden();
    });

    test('opening another preview closes the previous one', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const rows = page.locator('.process-row');
        await expect(rows.first()).toBeVisible();
        await expect(rows.nth(1)).toBeVisible();

        const firstPreviewButton = rows.nth(0).locator('.preview-button');
        const secondPreviewButton = rows.nth(1).locator('.preview-button');

        await firstPreviewButton.click();
        const firstPreview = rows.nth(0).locator('.process-preview');
        await expect(firstPreview).toBeVisible();

        await secondPreviewButton.click();
        const secondPreview = rows.nth(1).locator('.process-preview');
        await expect(secondPreview).toBeVisible();
        await expect(firstPreview).toBeHidden();
    });
});
