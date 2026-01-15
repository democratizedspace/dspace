import { test, expect } from '@playwright/test';
import { clearUserData, seedCustomProcess, waitForHydration } from './test-helpers';

test.describe('Custom process edit route', () => {
    test('renders edit form with seeded data and persists updates', async ({ page }) => {
        await clearUserData(page);

        const seedTitle = `Seeded Process ${Date.now()}`;
        const processId = await seedCustomProcess(page, {
            title: seedTitle,
            duration: '1h 30m',
            requireItems: [{ id: '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6', count: 2 }],
            consumeItems: [{ id: '60409c3f-56cf-4b9e-9e60-ca480d4896d0', count: 1 }],
            createItems: [{ id: '8f54a592-09de-4340-829b-7288897eb4c7', count: 3 }],
        });

        await page.goto(`/processes/${processId}/edit`);
        await waitForHydration(page);

        await expect(page.getByText('Page not found.')).toHaveCount(0);

        const titleInput = page.locator('#title');
        const durationInput = page.locator('#duration');
        const requiredCount = page
            .locator('#required-items-section input[type="number"]')
            .first();

        await expect(titleInput).toHaveValue(seedTitle);
        await expect(durationInput).toHaveValue('1h 30m');
        await expect(requiredCount).toHaveValue('2');

        const updatedTitle = `${seedTitle} Updated`;
        await titleInput.fill(updatedTitle);
        await page.locator('button.submit-button').click();

        await expect(page.locator('.success-message')).toContainText(
            'Process updated successfully.'
        );

        await page.reload();
        await waitForHydration(page);

        await expect(titleInput).toHaveValue(updatedTitle);

        await page.goto(`/processes/${processId}`);
        await waitForHydration(page);

        await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
    });
});
