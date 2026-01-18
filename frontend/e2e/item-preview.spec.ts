import { test, expect } from '@playwright/test';
import { clearUserData, createTestPngBuffer, waitForHydration } from './test-helpers';

test.describe('Custom content preview', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows item preview while filling form', async ({ page }) => {
        await page.goto('/inventory/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.fill('#name', 'Preview Item');
        await page.fill('#description', 'Preview item description');

        const preview = page.locator('.item-preview');
        await expect(preview).toHaveAttribute('data-hydrated', 'true');
        await expect(preview).toBeVisible();
        await expect(preview).toContainText('Preview Item');
        await expect(preview).toContainText('Preview item description');

        const fileInput = page.getByTestId('image-file-input');
        const buffer = await createTestPngBuffer(page, {
            background: '#3b82f6',
            accent: '#f97316',
            inset: 8,
        });
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer,
        });

        const img = preview.locator('img');
        await expect(fileInput).toHaveAttribute('data-processing', 'false');
        await expect(img).toBeVisible();
        await expect.poll(async () => img.getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/);
    });
});
