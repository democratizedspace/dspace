import { test, expect, type Locator } from '@playwright/test';
import { clearUserData, waitForHydration, navigateWithRetry } from './test-helpers';

async function expectPreviewState(
    previewButton: Locator,
    expanded: 'true' | 'false',
    { retryClick = true }: { retryClick?: boolean } = {}
) {
    await expect
        .poll(
            async () => {
                const current = await previewButton.getAttribute('aria-expanded');

                if (retryClick && current !== expanded) {
                    await previewButton.click({ timeout: 5000 });
                    return await previewButton.getAttribute('aria-expanded');
                }

                return current;
            },
            {
                timeout: 15000,
            }
        )
        .toBe(expanded);
}

test.describe('Process preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('reveals and hides process details from the manage view', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page);

        const manageRoot = page.getByTestId('manage-processes');
        await expect(manageRoot).toHaveAttribute('data-hydrated', 'true', { timeout: 15000 });
        // Extra wait to ensure onMount completes and processes are rendered
        await page.waitForSelector('.process-row .preview-button', {
            state: 'visible',
            timeout: 10000,
        });

        const firstRow = page.getByTestId('process-row').first();
        await expect(firstRow).toBeVisible();

        const previewButton = firstRow.getByTestId('process-preview-toggle');
        await expect(previewButton).toBeEnabled();
        await expectPreviewState(previewButton, 'false', { retryClick: false });
        const rowTitle = await firstRow.locator('h3').first().textContent();

        // Click to show preview
        await previewButton.click({ timeout: 5000 });

        // Wait for preview to appear
        const preview = firstRow.getByTestId('process-preview');
        await expectPreviewState(previewButton, 'true');
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
        await expectPreviewState(previewButton, 'false');
        await expect(preview).toHaveCount(0, { timeout: 10000 });
    });

    test('opening another preview closes the previous one', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page);

        const manageRoot = page.getByTestId('manage-processes');
        await expect(manageRoot).toHaveAttribute('data-hydrated', 'true', { timeout: 15000 });
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
        await expectPreviewState(firstPreviewButton, 'true');
        await expect(firstPreview).toHaveCount(1, { timeout: 10000 });

        // Wait a moment before clicking the second button
        await page.waitForTimeout(500);

        // Click second preview and wait for it to appear while first disappears
        await secondPreviewButton.click({ timeout: 5000 });
        const secondPreview = rows.nth(1).getByTestId('process-preview');
        await expectPreviewState(secondPreviewButton, 'true');
        await expectPreviewState(firstPreviewButton, 'false');
        await expect(secondPreview).toHaveCount(1, { timeout: 10000 });
        await expect(firstPreview).toHaveCount(0, { timeout: 10000 });
    });
});
