import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Processes', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('lists and previews built-in processes', async ({ page }) => {
        await page.goto('/processes/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, 'data-testid=manage-processes');

        const firstRow = page.getByTestId('process-row').first();
        await expect(firstRow).toBeVisible();

        const previewToggle = firstRow.getByTestId('process-preview-toggle');
        await expect(previewToggle).toBeVisible();

        await previewToggle.click();
        await expect(firstRow.getByTestId('process-preview')).toBeVisible();
    });
});
