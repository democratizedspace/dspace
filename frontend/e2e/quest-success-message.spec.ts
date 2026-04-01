import { test, expect } from '@playwright/test';
import {
    createTestPngBuffer,
    purgeClientState,
    waitForHydration,
    waitForImagePreview,
} from './test-helpers';

test('quest creation shows accessible success message with quest link', async ({ page }) => {
    await purgeClientState(page);
    await page.goto('/quests/create');
    await waitForHydration(page);

    await page.getByLabel('Title*').fill('Success Quest');
    await page.getByLabel('Description*').fill('Check success message');

    const fileInput = page.getByTestId('image-file-input');
    const buffer = await createTestPngBuffer(page, {
        background: '#4ade80',
        accent: '#f97316',
        inset: 6,
    });
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
