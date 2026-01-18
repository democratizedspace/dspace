import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { purgeClientState, waitForHydration, waitForImagePreview } from './test-helpers';

async function createTestPngBuffer(page: Page) {
    const dataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas context unavailable');
        }
        context.fillStyle = '#4ade80';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f97316';
        context.fillRect(6, 6, 20, 20);
        return canvas.toDataURL('image/png');
    });
    const base64Payload = dataUrl.split(',')[1] ?? '';
    return Buffer.from(base64Payload, 'base64');
}

test('quest creation shows accessible success message with quest link', async ({ page }) => {
    await purgeClientState(page);
    await page.goto('/quests/create');
    await waitForHydration(page);

    await page.getByLabel('Title*').fill('Success Quest');
    await page.getByLabel('Description*').fill('Check success message');

    const fileInput = page.getByTestId('image-file-input');
    const buffer = await createTestPngBuffer(page);
    await fileInput.setInputFiles({
        name: 'success-image.png',
        mimeType: 'image/png',
        buffer,
    });

    await waitForImagePreview(page, fileInput);

    await page.getByRole('button', { name: 'Create Quest' }).click();

    const successMessage = page.getByRole('status');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Quest created successfully');
    await expect(successMessage).toHaveAttribute('role', 'status');

    const questLink = successMessage.getByRole('link', { name: 'View quest' });
    await expect(questLink).toBeVisible();
    await expect(questLink).toHaveAttribute('href', /\/quests\//);
});
