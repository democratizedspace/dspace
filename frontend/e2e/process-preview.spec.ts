import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration, navigateWithRetry } from './test-helpers';

test.describe('Process preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('reveals and hides process details from the manage view', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page, 'data-testid=manage-processes');

        const manageProcesses = page.getByTestId('manage-processes');
        await expect(manageProcesses).toHaveAttribute('data-hydrated', 'true');

        const processList = manageProcesses.getByTestId('processes-list');
        await expect(processList).toBeVisible();

        const previewOpenValue = async () =>
            (await processList.getAttribute('data-preview-open')) || '';

        const rows = processList.getByTestId('process-row');
        await expect(rows.first()).toBeVisible();
        const processIds = await rows.evaluateAll((elements) =>
            elements
                .map((element) => element.getAttribute('data-process-id'))
                .filter((value): value is string => Boolean(value))
        );

        const processId = processIds[0];
        if (!processId) {
            throw new Error('Process row is missing a process id');
        }

        const firstRow = processList.locator(
            `[data-testid="process-row"][data-process-id="${processId}"]`
        );
        await expect(firstRow).toBeVisible();

        const previewButton = firstRow.getByTestId('process-preview-toggle');
        await previewButton.scrollIntoViewIfNeeded();
        await expect(previewButton).toBeEnabled();
        await expect(previewButton).toHaveAttribute(
            'aria-controls',
            `process-preview-${processId}`
        );
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe('');
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        const rowTitle = await firstRow.locator('h3').first().textContent();

        // Click to show preview
        await previewButton.click({ timeout: 5000, force: true });

        // Wait for preview to appear
        const preview = firstRow.getByTestId('process-preview');
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe(processId);
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
        await previewButton.click({ timeout: 5000, force: true });

        // Wait for it to disappear
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe('');
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(preview).toHaveCount(0, { timeout: 10000 });
    });

    test('opening another preview closes the previous one', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page, 'data-testid=manage-processes');

        const manageProcesses = page.getByTestId('manage-processes');
        await expect(manageProcesses).toHaveAttribute('data-hydrated', 'true');

        const processList = manageProcesses.getByTestId('processes-list');
        await expect(processList).toBeVisible();

        const previewOpenValue = async () =>
            (await processList.getAttribute('data-preview-open')) || '';
        const rows = processList.getByTestId('process-row');
        await expect(rows.first()).toBeVisible();

        const processIds = await rows.evaluateAll((elements) =>
            elements
                .map((element) => element.getAttribute('data-process-id'))
                .filter((value): value is string => Boolean(value))
        );
        const [firstProcessId, secondProcessId] = processIds;

        if (!firstProcessId || !secondProcessId) {
            throw new Error('Process rows are missing process ids');
        }

        const firstRow = processList.locator(
            `[data-testid="process-row"][data-process-id="${firstProcessId}"]`
        );
        const secondRow = processList.locator(
            `[data-testid="process-row"][data-process-id="${secondProcessId}"]`
        );

        await expect(firstRow).toBeVisible();
        await expect(secondRow).toBeVisible();

        const firstPreviewButton = firstRow.getByTestId('process-preview-toggle');
        const secondPreviewButton = secondRow.getByTestId('process-preview-toggle');

        await firstPreviewButton.scrollIntoViewIfNeeded();
        await expect(firstPreviewButton).toBeEnabled();
        await expect(secondPreviewButton).toBeEnabled();

        // Click first preview and wait for it to appear
        await firstPreviewButton.click({ timeout: 5000, force: true });
        const firstPreview = firstRow.getByTestId('process-preview');
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe(firstProcessId);
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(firstPreview).toHaveCount(1, { timeout: 10000 });

        // Wait a moment before clicking the second button
        await page.waitForTimeout(500);

        // Click second preview and wait for it to appear while first disappears
        await secondPreviewButton.scrollIntoViewIfNeeded();
        await secondPreviewButton.click({ timeout: 5000, force: true });
        const secondPreview = secondRow.getByTestId('process-preview');
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe(secondProcessId);
        await expect(secondPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(secondPreview).toHaveCount(1, { timeout: 10000 });
        await expect(firstPreview).toHaveCount(0, { timeout: 10000 });
    });
});
