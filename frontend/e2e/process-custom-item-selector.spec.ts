import { test, expect } from '@playwright/test';
import { clearUserData, ItemSelectorHelper, waitForHydration } from './test-helpers';

test.describe('Process creation item selectors', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows custom items in required item selector search', async ({ page }) => {
        const customItemName = 'Backflip Device';

        await page.goto('/inventory/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.fill('#name', customItemName);
        await page.fill('#description', 'Custom item used for process creation search.');

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'backflip-device.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake'),
        });

        await page.click('button.submit-button');
        await expect(page.locator('.submit-message.success')).toBeVisible();

        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const showAllCheckbox = page.locator('input[type="checkbox"].checkbox');
        if (!(await showAllCheckbox.isChecked())) {
            await showAllCheckbox.check();
        }

        const inventorySearch = page.getByRole('textbox', { name: 'Search items' });
        await inventorySearch.fill('backflip');
        await expect(page.getByText(customItemName)).toBeVisible();

        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await page.getByRole('button', { name: 'Add Required Item' }).click();

        const selectorContainer = page.locator('#required-items-section .item-selector').first();
        const selectorHelper = new ItemSelectorHelper(page, selectorContainer);
        await selectorHelper.open();

        const selectorSearch = selectorContainer.getByRole('textbox', { name: 'Search items' });
        await selectorSearch.fill('backflip');

        const option = selectorContainer.locator('button.item-row', {
            hasText: customItemName,
        });
        await expect(option.first()).toBeVisible();
    });
});
