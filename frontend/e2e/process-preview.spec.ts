import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration, navigateWithRetry } from './test-helpers';

test.describe('Process preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('reveals and hides process details from the manage view', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page);

        // Wait for component to be fully mounted (not just hydrated)
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });
        // Extra wait to ensure onMount completes and processes are rendered
        await page.waitForSelector('.process-row .preview-button', {
            state: 'visible',
            timeout: 10000,
        });

        const firstRow = page.getByTestId('process-row').first();
        await expect(firstRow).toBeVisible();

        const previewButton = firstRow.getByTestId('process-preview-toggle');
        const preview = firstRow.getByTestId('process-preview');
        await expect(previewButton).toBeEnabled();
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        const rowTitle = await firstRow.locator('h3').first().textContent();

        // Click to show preview
        await previewButton.click({ timeout: 5000 });

        await expect(previewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(preview).toHaveCount(1);
        const previewPanel = preview.first();
        await expect(previewPanel).toBeVisible({ timeout: 10000 });

        if (rowTitle) {
            await expect(previewPanel.locator('h3')).toHaveText(rowTitle.trim());
        }
        await expect(previewPanel).toContainText('Duration:');
        await expect(previewPanel.locator('li')).not.toHaveCount(0);

        // Wait for preview to be fully rendered
        await page.waitForTimeout(500);

        // Click to hide preview
        await previewButton.click({ timeout: 5000 });

        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(preview).toHaveCount(0);
    });

    test('opening another preview closes the previous one', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page);

        // Wait for component to be fully mounted (not just hydrated)
        await page.waitForSelector('[data-hydrated="true"]', { timeout: 10000 });
        // Extra wait to ensure onMount completes and processes are rendered
        await page.waitForSelector('.process-row .preview-button', {
            state: 'visible',
            timeout: 10000,
        });

        const rows = page.getByTestId('process-row');
        await expect(rows.first()).toBeVisible();
        await expect(rows.nth(1)).toBeVisible();

        const firstPreviewButton = rows.nth(0).getByTestId('process-preview-toggle');
        const secondPreviewButton = rows.nth(1).getByTestId('process-preview-toggle');

        await expect(firstPreviewButton).toBeEnabled();
        await expect(secondPreviewButton).toBeEnabled();

        // Click first preview and wait for it to appear
        await firstPreviewButton.click({ timeout: 5000 });
        const firstPreview = rows.nth(0).getByTestId('process-preview');
        await expect(firstPreview).toBeVisible({ timeout: 10000 });
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'true');

        // Wait a moment before clicking the second button
        await page.waitForTimeout(500);

        // Click second preview and wait for it to appear while first disappears
        await secondPreviewButton.click({ timeout: 5000 });
        const secondPreview = rows.nth(1).getByTestId('process-preview');
        await expect(secondPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(secondPreview).toHaveCount(1);
        await expect(secondPreview.first()).toBeVisible({ timeout: 10000 });
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(firstPreview).toHaveCount(0);
    });
});
