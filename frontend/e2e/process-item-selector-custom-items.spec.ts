import { test, expect } from '@playwright/test';
import {
    clearUserData,
    createCustomItem,
    ItemSelectorHelper,
    waitForHydration,
} from './test-helpers';

test.describe('Process item selector custom items', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows custom items in process item selectors', async ({ page }) => {
        const customItemName = 'backflip device';

        await createCustomItem(page, {
            name: customItemName,
            description: 'Custom item used to validate process selectors.',
        });

        await page.goto('/inventory');
        await waitForHydration(page);

        const showAllCheckbox = page.getByRole('checkbox', { name: /show all items/i });
        if ((await showAllCheckbox.count()) > 0 && !(await showAllCheckbox.isChecked())) {
            await showAllCheckbox.check();
        }

        const inventorySearch = page.getByRole('textbox', { name: 'Search items' });
        await inventorySearch.fill('backflip');

        const inventoryItemName = page.locator('.item .name', { hasText: customItemName });
        await expect(inventoryItemName).toBeVisible();

        await page.goto('/processes/create');
        await waitForHydration(page, '.process-form');

        await page.getByRole('button', { name: 'Add Required Item' }).click();
        const itemRow = page.locator('#required-items-section .item-row').first();
        const selectorHelper = new ItemSelectorHelper(page, itemRow);
        await selectorHelper.open();

        const selectorSearch = itemRow.getByRole('textbox', { name: 'Search items' });
        await selectorSearch.fill('backflip');

        const option = itemRow.getByRole('option', { name: /backflip device/i });
        await expect(option).toBeVisible();
    });
});
