import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Processes', () => {
    test.beforeEach(async ({ page }) => {
        page.on('pageerror', (error) => {
            const currentUrl = page.url();
            const stackOrMessage = error?.stack || error?.message || String(error);
            console.error(`[pageerror][url=${currentUrl}] ${stackOrMessage}`);

            if (currentUrl.includes('/processes/manage')) {
                throw error;
            }
        });

        page.on('console', (message) => {
            console.log(`[console.${message.type()}] ${message.text()}`);
        });

        await clearUserData(page);
    });

    test('lists and previews built-in processes', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, 'data-testid=manage-processes');

        const manageProcesses = page.getByTestId('manage-processes');
        await expect(manageProcesses).toHaveAttribute('data-hydrated', 'true');

        const processList = manageProcesses.getByTestId('processes-list');
        await expect(processList).toHaveAttribute('data-preview-open', '');
        await expect(processList).toHaveAttribute('data-last-toggle', '');

        const firstRow = processList.getByTestId('process-row').first();
        await expect(firstRow).toBeVisible();

        const processId = await firstRow.getAttribute('data-process-id');
        if (!processId) {
            throw new Error('Process row is missing a process id');
        }

        const previewToggle = firstRow.getByTestId('process-preview-toggle');
        await expect(previewToggle).toBeVisible();

        await previewToggle.click();
        await expect(processList).toHaveAttribute('data-last-toggle', processId);
        await expect(processList).toHaveAttribute('data-preview-open', processId);
        await expect(previewToggle).toHaveAttribute('aria-expanded', 'true');
        await expect(firstRow.getByTestId('process-preview')).toBeVisible();
    });
});
