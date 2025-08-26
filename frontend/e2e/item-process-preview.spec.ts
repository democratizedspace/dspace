import { test, expect } from '@playwright/test';
import { clearUserData, ItemSelectorHelper } from './test-helpers';

test.describe('Custom content preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows item preview while filling form', async ({ page }) => {
        await page.goto('/inventory/create');
        await page.waitForLoadState('networkidle');

        await page.fill('#name', 'Preview Item');
        await page.fill('#description', 'Preview item description');

        const preview = page.locator('.item-preview');
        await expect(preview).toBeVisible();

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake'),
        });

        const img = preview.locator('img');
        await expect(img).toBeVisible();
        const src = await img.getAttribute('src');
        expect(src).toContain('data:');
    });

    test('shows process preview when preview button clicked', async ({ page }) => {
        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');

        await page.fill('#title', 'Preview Process');
        await page.fill('#duration', '1h');

        await page.getByRole('button', { name: 'Add Required Item' }).click();
        const row = page.locator('#required-items-section .item-row').first();
        const selector = new ItemSelectorHelper(page, row);
        await selector.selectItem();

        const btn = page.locator('button.preview-button');
        await btn.click();

        const preview = page.locator('.process-preview');
        await expect(preview).toBeVisible();
        await expect(preview).toContainText('Preview Process');
    });
});
