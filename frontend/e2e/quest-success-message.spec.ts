import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test('quest creation shows accessible success message with quest link', async ({ page }) => {
    await clearUserData(page);
    await page.goto('/quests/create');
    await waitForHydration(page);

    await page.getByLabel('Title*').fill('Success Quest');
    await page
        .getByLabel('Description*')
        .fill('Check success message to ensure accessible feedback.');

    const fileInput = page.getByLabel('Upload an Image*');
    await fileInput.setInputFiles({
        name: 'success-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake image content'),
    });

    const imagePreview = page.locator('.image-preview');
    await expect(imagePreview).toBeVisible();

    await page.getByRole('button', { name: /^Create Quest$/ }).click();

    const successMessage = page.getByRole('status');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Quest created successfully');

    const questLink = successMessage.getByRole('link', { name: 'View quest' });
    await expect(questLink).toBeVisible();
    await expect(questLink).toHaveAttribute('href', /\/quests\//);
});
