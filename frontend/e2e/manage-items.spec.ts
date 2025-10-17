import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('Manage Items', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test.afterEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('lists items on manage page', async ({ page }) => {
        await page.goto('/inventory/manage');
        await waitForHydration(page, 'data-testid=manage-items-root');
        await expect(page.getByRole('heading', { name: /manage items/i })).toBeVisible();
        await expect(page.getByTestId('manage-item-row').first()).toBeVisible();
    });

    test('filters items by category chips', async ({ page }) => {
        await page.goto('/inventory/manage');
        await waitForHydration(page, 'data-testid=manage-items-root');

        const aquariumRow = page
            .getByTestId('manage-item-row')
            .filter({ hasText: 'aquarium heater (150 W)' });
        const toolRow = page
            .getByTestId('manage-item-row')
            .filter({ hasText: 'soldering iron kit' });

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
