import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test('quest creation shows accessible success message with quest link', async ({ page }) => {
    await clearUserData(page);
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');

    await page.fill('#title', 'Success Quest');
    await page.fill('#description', 'Check success message');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
        name: 'success-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake image content'),
    });

    const imagePreview = page.locator('.image-preview');
    await expect(imagePreview).toBeVisible();

    await page.locator('button.submit-button').click();

    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Quest created successfully');
    await expect(successMessage).toHaveAttribute('role', 'status');

    const questLink = successMessage.getByRole('link', { name: 'View quest' });
    await expect(questLink).toBeVisible();
    await expect(questLink).toHaveAttribute('href', /\/quests\//);
});
