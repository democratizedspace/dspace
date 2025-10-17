import { test, expect } from '@playwright/test';
import { purgeClientState } from './test-helpers';

test('quest creation shows accessible success message with quest link', async ({ page }) => {
    await purgeClientState(page);
    await page.goto('/quests/create');

    const titleInput = page.getByLabel(/^Title/i);
    const descriptionInput = page.getByLabel(/^Description/i);
    await expect(titleInput).toBeVisible();
    await expect(descriptionInput).toBeVisible();

    await titleInput.fill('Success Quest');
    await descriptionInput.fill('Check success message');

    const fileInput = page.getByLabel(/^Upload an Image/i);
    await fileInput.setInputFiles({
        name: 'success-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake image content'),
    });

    const imagePreview = page.locator('.image-preview');
    await expect(imagePreview).toBeVisible();

    await page.getByRole('button', { name: /create quest/i }).click();

    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Quest created successfully');
    await expect(successMessage).toHaveAttribute('role', 'status');

    const questLink = successMessage.getByRole('link', { name: 'View quest' });
    await expect(questLink).toBeVisible();
    await expect(questLink).toHaveAttribute('href', /\/quests\//);
});
