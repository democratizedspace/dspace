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

    test('should debug item selector component', async ({ page }) => {
        // First make sure we have some items in the inventory
        const itemIds = await createTestItems(page, 3);
        console.log(`Created ${itemIds.length} test items for use in the process`);

        // Now navigate to the process creation page
        await page.goto('/processes/create');
        await page.waitForLoadState('networkidle');

        // Take a screenshot of the initial form
        await page.screenshot({ path: './test-artifacts/screenshots/debug-process-form-initial.png' });

        // Fill in basic process details using our helper
        const processTitle = `Debug Process ${Date.now()}`;
        const success = await fillProcessForm(
            page,
            processTitle,
            '1h 30m',
            1, // Add 1 required item
            1, // Add 1 consumed item
            1 // Add 1 created item
        );

        if (success) {
            console.log('Successfully filled out process form');

            // Take a screenshot before submission
            await page.screenshot({ path: './test-artifacts/screenshots/debug-process-form-filled.png' });

            // Submit the form
            const submitButton = page.locator('button.submit-button');
            if ((await submitButton.count()) > 0) {
                await submitButton.click();
                console.log('Clicked submit button');

                // Wait for redirect or success message
                await page.waitForTimeout(5000);
                await page.screenshot({ path: './test-artifacts/screenshots/debug-after-submit.png' });

                // Log the current URL
                console.log('Current URL after submission:', page.url());

                // Check if we're no longer on the form page
                const formElement = page.locator('form.process-form');
                if ((await formElement.count()) === 0) {
                    console.log('Form is no longer visible, process creation likely succeeded');

                    // Check if we're on the processes list page
                    if (page.url().includes('/processes')) {
                        console.log('Successfully redirected to processes page');
                    }
                } else {
                    console.log('Form is still visible, process creation may have failed');

                    // Check if there are any error messages
                    const errorMessages = page.locator('.error-message');
                    if ((await errorMessages.count()) > 0) {
                        console.log('Found error messages:', await errorMessages.textContent());
                    }
                }
            } else {
                console.log('Submit button not found');
            }
        } else {
            console.log('Failed to fill out process form');
            await page.screenshot({ path: './test-artifacts/screenshots/debug-form-fill-failed.png' });
        }
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
            await page.screenshot({ path: './test-artifacts/screenshots/item-selector-initial.png' });

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
                    await page.screenshot({ path: './test-artifacts/screenshots/item-selector-opened.png' });

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
