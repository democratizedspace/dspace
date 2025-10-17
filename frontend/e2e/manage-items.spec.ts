import { test, expect } from '@playwright/test';
import { registerClientStateHooks, waitForHydration } from './test-helpers';

test.describe('Manage Items', () => {
    registerClientStateHooks(test);

    test('lists items on manage page', async ({ page }) => {
        await page.goto('/inventory/manage');
        await waitForHydration(page);
        await expect(page.getByRole('heading', { name: /manage items/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /aquarium heater/i })).toBeVisible();
    });

    test('filters items by category chips', async ({ page }) => {
        await page.goto('/inventory/manage');
        await waitForHydration(page);

        const aquariumRow = page.getByRole('link', { name: /aquarium heater/i });
        const toolRow = page.getByRole('link', { name: /soldering iron kit/i });

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
