import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Processes item metadata loading', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('keeps preview item names blank until metadata resolves without blocking row details', async ({
        page,
    }) => {
        await page.goto('/processes', { waitUntil: 'domcontentloaded' });

        const firstRow = page.locator('article.process-row').first();
        await expect(firstRow).toBeVisible();
        await expect(firstRow.getByText('Duration')).toBeVisible();

        const firstPreviewItemName = firstRow.getByTestId('preview-item-name').first();
        await expect(firstPreviewItemName).toHaveText('', { timeout: 5000 });
        await expect(firstPreviewItemName).not.toHaveText('', { timeout: 10000 });
    });
});
