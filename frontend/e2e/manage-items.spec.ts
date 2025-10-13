import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Manage Items', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('lists items on manage page', async ({ page }) => {
        await page.goto('/inventory/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByRole('heading', { name: /manage items/i })).toBeVisible();
        await expect(page.locator('.item-row').first()).toBeVisible();
    });

    test('filters items by category chips', async ({ page }) => {
        await page.goto('/inventory/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const aquariumRow = page
            .locator('.item-row')
            .filter({ hasText: 'aquarium heater (150 W)' });
        const toolRow = page.locator('.item-row').filter({ hasText: 'soldering iron kit' });

        await expect(aquariumRow).toHaveCount(1);
        await expect(toolRow).toHaveCount(1);

        const toolsChip = page.getByRole('button', { name: 'Tools' });
        await toolsChip.click();

        await expect(toolRow).toHaveCount(1);
        await expect(aquariumRow).toHaveCount(0);

        const allChip = page.getByRole('button', { name: 'All categories' });
        await allChip.click();

        await expect(aquariumRow).toHaveCount(1);
    });
});
