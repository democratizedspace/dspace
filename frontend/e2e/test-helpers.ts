import { Page, Locator, expect } from '@playwright/test';

/**
 * Utility functions to help with testing the DSpace application
 */

/**
 * Clears user data by clearing localStorage
 * (IndexedDB access is restricted in Playwright)
 */
export async function clearUserData(page: Page): Promise<void> {
    // Navigate to the site root first to ensure we're on the correct domain
    await page.goto('/');
    // Clear localStorage
    await page.evaluate(() => {
        localStorage.clear();
        console.log('User data cleared via localStorage');
    });
}

/**
 * Creates test items for use in other tests
 * @returns The IDs of the created items (if available)
 */
export async function createTestItems(page: Page, count = 2): Promise<string[]> {
    const itemIds: string[] = [];

    for (let i = 0; i < count; i++) {
        // Navigate to the item creation page
        await page.goto('/inventory/create');
        await page.waitForLoadState('networkidle');

        // Generate a unique name
        const uniqueItemName = `Test Item ${i + 1}-${Date.now()}`;

        // Fill in the item form
        await page.fill('#name', uniqueItemName);
        await page.fill('#description', `Test item ${i + 1} for automated testing`);

        // Submit the form
        await page.click('button.submit-button');

        // Wait for confirmation
        const successMessage = page.locator('.success-message');
        await expect(successMessage).toBeVisible({ timeout: 10000 });

        // Extract item ID if possible
        const viewButton = page.locator('.view-button');
        if ((await viewButton.count()) > 0) {
            const href = (await viewButton.getAttribute('href')) || '';
            const id = href.split('/').pop();
            if (id) itemIds.push(id);
        }
    }

    return itemIds;
}

/**
 * Finds and clicks a button using multiple selector strategies
 * @returns true if the button was found and clicked
 */
export async function findAndClickButton(page: Page, buttonText: string): Promise<boolean> {
    // Try different selector strategies
    let buttonLocator: Locator;

    // First try: most specific locator
    buttonLocator = page.locator(`button:has-text("${buttonText}")`);

    if ((await buttonLocator.count()) === 0) {
        // Second try: text content
        buttonLocator = page.locator(`button:text-is("${buttonText}")`);
    }

    if ((await buttonLocator.count()) === 0) {
        // Third try: more generic
        buttonLocator = page.locator('button').filter({ hasText: buttonText });
    }

    // Log what we found
    console.log(`Found ${await buttonLocator.count()} buttons matching "${buttonText}"`);

    // Click if found
    if ((await buttonLocator.count()) > 0) {
        await buttonLocator.click();
        console.log(`Clicked "${buttonText}" button`);
        return true;
    }

    return false;
}

/**
 * Specialized helper for dealing with ItemSelector components
 * ItemSelector is complex because it has different states (collapsed/expanded)
 */
export class ItemSelectorHelper {
    constructor(private page: Page, private selectorContainer: string | Locator) {}

    /**
     * Opens the item selector by clicking the Select Item button
     */
    async open(): Promise<boolean> {
        const container =
            typeof this.selectorContainer === 'string'
                ? this.page.locator(this.selectorContainer)
                : this.selectorContainer;

        // First check if it's already expanded
        const expandedView = container.locator('.selector-expanded');
        const itemsList = container.locator('.items-list');

        // If either is visible, consider it expanded
        if ((await expandedView.count()) > 0 || (await itemsList.count()) > 0) {
            console.log('Item selector already expanded');
            return true;
        }

        // Look for any button that can expand the selector
        // Try different selectors to handle both old and new versions
        const selectButton = container.locator('button');

        if ((await selectButton.count()) > 0) {
            // Take screenshot before clicking
            await this.page.screenshot({ path: './item-selector-before-click.png' });

            await selectButton.first().click();
            console.log('Clicked Select Item button');

            // Wait for dropdown to appear
            await this.page.waitForTimeout(500);

            // Verify it expanded - check for either selector-expanded or items-list
            if (
                (await container.locator('.selector-expanded').count()) > 0 ||
                (await container.locator('.items-list').count()) > 0
            ) {
                return true;
            }
        }

        console.log('Could not open item selector');
        return false;
    }

    /**
     * Selects an item from the dropdown
     * @param index The index of the item to select (0-based)
     */
    async selectItem(index = 0): Promise<boolean> {
        const container =
            typeof this.selectorContainer === 'string'
                ? this.page.locator(this.selectorContainer)
                : this.selectorContainer;

        // Make sure selector is open
        if (!(await this.open())) {
            return false;
        }

        // Look for item rows
        const itemRows = container.locator('.item-row');
        const count = await itemRows.count();

        console.log(`Found ${count} item rows`);

        if (count > index) {
            // Click the item at specified index
            await itemRows.nth(index).click();
            console.log(`Clicked item at index ${index}`);

            // Wait for selection to take effect
            await this.page.waitForTimeout(500);

            // Verify selection happened (selector should collapse)
            if ((await container.locator('.selector-expanded').count()) === 0) {
                return true;
            }
        }

        console.log(`Could not select item at index ${index}`);
        return false;
    }

    /**
     * Sets the quantity for the selected item
     */
    async setQuantity(quantity: number): Promise<boolean> {
        const container =
            typeof this.selectorContainer === 'string'
                ? this.page.locator(this.selectorContainer)
                : this.selectorContainer;

        const quantityInput = container.locator('input[type="number"]');

        if ((await quantityInput.count()) > 0) {
            await quantityInput.fill(quantity.toString());
            console.log(`Set quantity to ${quantity}`);
            return true;
        }

        console.log('Quantity input not found');
        return false;
    }
}

/**
 * Fills out the process creation form
 */
export async function fillProcessForm(
    page: Page,
    title: string,
    duration: string,
    addRequiredItems = 0,
    addConsumedItems = 0,
    addCreatedItems = 0
): Promise<boolean> {
    try {
        // Fill in basic process details
        await page.fill('#title', title);
        await page.fill('#duration', duration);

        // Handle required items
        for (let i = 0; i < addRequiredItems; i++) {
            if (!(await findAndClickButton(page, 'Add Required Item'))) {
                console.log('Could not add required item');
                return false;
            }

            // Create a helper for this item row
            const itemRow = page.locator('.form-group:has-text("Required Items") .item-row').nth(i);
            const helper = new ItemSelectorHelper(page, itemRow);

            // Select an item and set quantity
            if (!(await helper.selectItem(0))) {
                console.log('Could not select required item');
                return false;
            }

            if (!(await helper.setQuantity(1))) {
                console.log('Could not set required item quantity');
                return false;
            }
        }

        // Handle consumed items
        for (let i = 0; i < addConsumedItems; i++) {
            if (!(await findAndClickButton(page, 'Add Consumed Item'))) {
                console.log('Could not add consumed item');
                return false;
            }

            // Create a helper for this item row
            const itemRow = page.locator('.form-group:has-text("Consumed Items") .item-row').nth(i);
            const helper = new ItemSelectorHelper(page, itemRow);

            // Select an item and set quantity
            if (!(await helper.selectItem(0))) {
                console.log('Could not select consumed item');
                return false;
            }

            if (!(await helper.setQuantity(1))) {
                console.log('Could not set consumed item quantity');
                return false;
            }
        }

        // Handle created items
        for (let i = 0; i < addCreatedItems; i++) {
            if (!(await findAndClickButton(page, 'Add Created Item'))) {
                console.log('Could not add created item');
                return false;
            }

            // Create a helper for this item row
            const itemRow = page.locator('.form-group:has-text("Created Items") .item-row').nth(i);
            const helper = new ItemSelectorHelper(page, itemRow);

            // Select an item and set quantity
            if (!(await helper.selectItem(0))) {
                console.log('Could not select created item');
                return false;
            }

            if (!(await helper.setQuantity(1))) {
                console.log('Could not set created item quantity');
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error filling process form:', error);
        return false;
    }
}
