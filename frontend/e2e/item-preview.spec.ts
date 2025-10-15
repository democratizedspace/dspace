import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

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
});
