import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

async function createTestPngBuffer(page: Page) {
    const dataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas context unavailable');
        }
        context.fillStyle = '#3b82f6';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f97316';
        context.fillRect(8, 8, 16, 16);
        return canvas.toDataURL('image/png');
    });
    const base64Payload = dataUrl.split(',')[1] ?? '';
    return Buffer.from(base64Payload, 'base64');
}

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
        const buffer = await createTestPngBuffer(page);
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer,
        });

        const img = preview.locator('img');
        await expect(img).toBeVisible();
        await expect(fileInput).toHaveAttribute('data-processing', 'false');
        await expect.poll(async () => img.getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/);
    });
});
