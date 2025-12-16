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

        const processList = page.getByTestId('processes-list');
        await expect(processList).toBeVisible();

        const firstRow = processList.getByTestId('process-row').first();
        await expect(firstRow).toBeVisible();
        const processId = await firstRow.getAttribute('data-process-id');
        expect(processId).toBeTruthy();
        if (!processId) {
            throw new Error('Process row is missing a process id');
        }

        const previewButton = firstRow.getByTestId('process-preview-toggle');
        await expect(previewButton).toBeEnabled();
        await expect(previewButton).toHaveAttribute(
            'aria-controls',
            `process-preview-${processId}`
        );
        await expect(processList).toHaveAttribute('data-preview-open', '');
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        const rowTitle = await firstRow.locator('h3').first().textContent();

        // Click to show preview
        await previewButton.click({ timeout: 5000 });

        // Wait for preview to appear
        const preview = firstRow.getByTestId('process-preview');
        await expect(processList).toHaveAttribute('data-preview-open', processId);
        await expect(previewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(preview).toHaveCount(1, { timeout: 10000 });
        await expect(preview.first()).toBeVisible({ timeout: 10000 });

        if (rowTitle) {
            await expect(preview.first().locator('h3')).toHaveText(rowTitle.trim());
        }
        await expect(preview).toContainText('Duration:');
        await expect(preview.first().locator('li')).not.toHaveCount(0);

        // Wait for preview to be fully rendered
        await page.waitForTimeout(500);

        // Click to hide preview
        await previewButton.click({ timeout: 5000 });

        // Wait for it to disappear
        await expect(processList).toHaveAttribute('data-preview-open', '');
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(preview).toHaveCount(0, { timeout: 10000 });
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

        const processList = page.getByTestId('processes-list');
        const rows = processList.getByTestId('process-row');
        await expect(rows.first()).toBeVisible();
        await expect(rows.nth(1)).toBeVisible();
        const firstProcessId = await rows.nth(0).getAttribute('data-process-id');
        const secondProcessId = await rows.nth(1).getAttribute('data-process-id');
        if (!firstProcessId || !secondProcessId) {
            throw new Error('Process rows are missing process ids');
        }

        const firstPreviewButton = rows.nth(0).getByTestId('process-preview-toggle');
        const secondPreviewButton = rows.nth(1).getByTestId('process-preview-toggle');

        await expect(firstPreviewButton).toBeEnabled();
        await expect(secondPreviewButton).toBeEnabled();

        // Click first preview and wait for it to appear
        await firstPreviewButton.click({ timeout: 5000 });
        const firstPreview = rows.nth(0).getByTestId('process-preview');
        await expect(processList).toHaveAttribute('data-preview-open', firstProcessId);
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(firstPreview).toHaveCount(1, { timeout: 10000 });

        // Wait a moment before clicking the second button
        await page.waitForTimeout(500);

        // Click second preview and wait for it to appear while first disappears
        await secondPreviewButton.click({ timeout: 5000 });
        const secondPreview = rows.nth(1).getByTestId('process-preview');
        await expect(processList).toHaveAttribute('data-preview-open', secondProcessId);
        await expect(secondPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(secondPreview).toHaveCount(1, { timeout: 10000 });
        await expect(firstPreview).toHaveCount(0, { timeout: 10000 });
    });
});
