import { test, expect } from '@playwright/test';
import {
    clearUserData,
    createTestItems,
    fillProcessForm,
    ItemSelectorHelper,
    findAndClickButton,
} from './test-helpers';

/**
 * This test file is dedicated to testing process creation in a more reliable way.
 * It includes extra debugging information and multiple selector strategies to
 * help diagnose issues with the process form interaction.
 */
test.describe('Process Creation', () => {
    test.setTimeout(60000); // 1 minute timeout for these complex tests

    test.beforeEach(async ({ page }) => {
        // Clear user data before each test
        await clearUserData(page);
    });

    test('creates a process with a selected created item', async ({ page }) => {
        await createTestItems(page, 1);

        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');

        const processTitle = `Created Item Process ${Date.now()}`;
        await page.fill('#title', processTitle);
        await page.fill('#duration', '1h 30m');

        const added = await findAndClickButton(page, 'Add Created Item');
        expect(added).toBe(true);

        const createdItemsSection = page.locator('.form-group:has-text("Created Items")');
        const createdItemRow = createdItemsSection.locator('.item-row').first();
        await expect(createdItemRow).toBeVisible();
        const selector = new ItemSelectorHelper(page, createdItemRow);

        const opened = await selector.open();
        expect(opened).toBe(true);

        const selected = await selector.selectItem(0);
        expect(selected).toBe(true);

        const quantitySet = await selector.setQuantity(2);
        expect(quantitySet).toBe(true);
        await expect(createdItemRow.locator('input[type="number"]')).toHaveValue('2');

        await page.locator('button.submit-button').click();

        const successMessage = page.locator('.success-message');
        await expect(successMessage).toBeVisible();
        await expect(successMessage).toContainText('Process created successfully');

        await expect(page.locator('#title')).toHaveValue('');
        await expect(page.locator('#duration')).toHaveValue('');

        // Ensure the created process persisted the selected item
        const previewLink = page.locator('.success-link');
        if ((await previewLink.count()) > 0) {
            await previewLink.click();
            await expect(page).toHaveURL(/\/processes\//);
            await expect(page.locator('body')).toContainText(processTitle);
        }
    });

    test('should create process with seconds duration', async ({ page }) => {
        await createTestItems(page, 1);
        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');

        const processTitle = `Seconds Duration ${Date.now()}`;
        const success = await fillProcessForm(page, processTitle, '2m 30s', 1, 0, 0);
        expect(success).toBe(true);

        const submitButton = page.locator('button.submit-button');
        await submitButton.click();
        await page.waitForTimeout(3000);

        const errorMessages = page.locator('.error-message');
        expect(await errorMessages.count()).toBe(0);
    });

    test('should test item selector in isolation', async ({ page }) => {
        // Create test items first
        await createTestItems(page, 2);

        // Navigate to the process creation page
        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');

        // Fill in the basic process details
        await page.fill('#title', `Item Selector Test ${Date.now()}`);
        await page.fill('#duration', '1h');

        // Add a single item to test the selector
        if (await findAndClickButton(page, 'Add Created Item')) {
            console.log('Added a created item row');

            // Take a screenshot
            await page.screenshot({
                path: './test-artifacts/screenshots/item-selector-initial.png',
            });

            // Get the item row
            const itemRow = page.locator('.form-group:has-text("Created Items") .item-row').first();
            if ((await itemRow.count()) > 0) {
                console.log('Found the item row');

                // Create a helper for this selector
                const helper = new ItemSelectorHelper(page, itemRow);

                // Try to open the selector
                const opened = await helper.open();
                console.log('Opened selector:', opened);

                if (opened) {
                    // Take a screenshot
                    await page.screenshot({
                        path: './test-artifacts/screenshots/item-selector-opened.png',
                    });

                    // Look for the selector-expanded element and log its HTML
                    const expandedSelector = itemRow.locator('.selector-expanded');
                    if ((await expandedSelector.count()) > 0) {
                        console.log('Expanded selector HTML:', await expandedSelector.innerHTML());

                        // Check for item rows
                        const itemRows = expandedSelector.locator('.item-row');
                        console.log(
                            `Found ${await itemRows.count()} item rows in the expanded selector`
                        );

                        if ((await itemRows.count()) > 0) {
                            // Try to select the first item
                            const selected = await helper.selectItem(0);
                            console.log('Selected item:', selected);

                            if (selected) {
                                // Take a screenshot
                                await page.screenshot({
                                    path: './test-artifacts/screenshots/item-selector-item-selected.png',
                                });

                                // Try to set the quantity
                                const quantitySet = await helper.setQuantity(3);
                                console.log('Set quantity:', quantitySet);

                                if (quantitySet) {
                                    // Take a screenshot
                                    await page.screenshot({
                                        path: './test-artifacts/screenshots/item-selector-quantity-set.png',
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});
