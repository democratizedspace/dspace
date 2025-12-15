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
        
        // Wait for component to be fully mounted (not just hydrated)
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });
        // Extra wait to ensure onMount completes and processes are rendered
        await page.waitForSelector('.process-row .preview-button', { state: 'visible', timeout: 10000 });

        const firstRow = page.locator('.process-row').first();
        await expect(firstRow).toBeVisible();

        const previewButton = firstRow.locator('.preview-button');
        await expect(previewButton).toBeEnabled();
        const rowTitle = await firstRow.locator('h3').first().textContent();

        // Click to show preview
        await previewButton.click({ timeout: 5000 });
        
        // Wait for preview to appear
        const preview = firstRow.locator('.process-preview');
        await expect(preview).toBeVisible({ timeout: 10000 });
        
        if (rowTitle) {
            await expect(preview.locator('h3')).toHaveText(rowTitle.trim());
        }
        await expect(preview).toContainText('Duration:');
        await expect(preview.locator('li')).not.toHaveCount(0);

        // Wait for preview to be fully rendered
        await page.waitForTimeout(500);
        
        // Click to hide preview
        await previewButton.click({ timeout: 5000 });
        
        // Wait for it to disappear
        await expect(preview).toBeHidden({ timeout: 10000 });
    });

    test('opening another preview closes the previous one', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        
        // Wait for component to be fully mounted (not just hydrated)
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });
        // Extra wait to ensure onMount completes and processes are rendered
        await page.waitForSelector('.process-row .preview-button', { state: 'visible', timeout: 10000 });

        const rows = page.locator('.process-row');
        await expect(rows.first()).toBeVisible();
        await expect(rows.nth(1)).toBeVisible();

        const firstPreviewButton = rows.nth(0).locator('.preview-button');
        const secondPreviewButton = rows.nth(1).locator('.preview-button');
        
        await expect(firstPreviewButton).toBeEnabled();
        await expect(secondPreviewButton).toBeEnabled();

        // Click first preview and wait for it to appear
        await firstPreviewButton.click({ timeout: 5000 });
        const firstPreview = rows.nth(0).locator('.process-preview');
        await expect(firstPreview).toBeVisible({ timeout: 10000 });

        // Wait a moment before clicking the second button
        await page.waitForTimeout(500);

        // Click second preview and wait for it to appear while first disappears
        await secondPreviewButton.click({ timeout: 5000 });
        const secondPreview = rows.nth(1).locator('.process-preview');
        await expect(secondPreview).toBeVisible({ timeout: 10000 });
        await expect(firstPreview).toBeHidden({ timeout: 10000 });
    });
});
