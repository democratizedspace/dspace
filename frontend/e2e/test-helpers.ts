import { Page, Locator, expect } from '@playwright/test';

type WaitForQuestRecordOptions = {
    timeoutMs?: number;
};

export async function purgeClientState(page: Page): Promise<void> {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(async () => {
        const deleteDatabase = (name: string) =>
            new Promise<void>((resolve) => {
                try {
                    const request = indexedDB.deleteDatabase(name);
                    request.onerror = () => resolve();
                    request.onblocked = () => resolve();
                    request.onsuccess = () => resolve();
                } catch (error) {
                    console.warn('Failed to delete IndexedDB database', name, error);
                    resolve();
                }
            });

        try {
            await deleteDatabase('CustomContent');
        } catch (error) {
            console.warn('Unable to purge CustomContent database', error);
        }

        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (error) {
            console.warn('Failed to clear web storage', error);
        }
    });
}

export async function waitForQuestRecordByTitle(
    page: Page,
    title: string,
    { timeoutMs = 15_000 }: WaitForQuestRecordOptions = {}
): Promise<number> {
    const handle = await page.waitForFunction(
        async (questTitle) => {
            const lookupQuestId = () =>
                new Promise<number | string | null>((resolve) => {
                    try {
                        const request = indexedDB.open('CustomContent');

                        request.onerror = () => resolve(null);
                        request.onupgradeneeded = () => resolve(null);
                        request.onsuccess = () => {
                            const db = request.result;

                            if (!db.objectStoreNames.contains('quests')) {
                                db.close();
                                resolve(null);
                                return;
                            }

                            const transaction = db.transaction('quests', 'readonly');
                            const store = transaction.objectStore('quests');
                            const getAll = store.getAll();

                            getAll.onerror = () => {
                                db.close();
                                resolve(null);
                            };

                            getAll.onsuccess = () => {
                                const quests = Array.isArray(getAll.result) ? getAll.result : [];
                                const expectedTitle = questTitle.toString().trim().toLocaleLowerCase();
                                const match = quests.find((quest: any) => {
                                    const questTitleValue = (quest?.title ?? '').toString().trim();
                                    if (!questTitleValue) {
                                        return false;
                                    }

                                    return questTitleValue.toLocaleLowerCase() === expectedTitle;
                                });

                                db.close();

                                if (!match) {
                                    resolve(null);
                                    return;
                                }

                                if (match?.id != null) {
                                    resolve(match.id as number | string);
                                    return;
                                }

                                if (match?.questId != null) {
                                    resolve(match.questId as number | string);
                                    return;
                                }

                                resolve(null);
                            };
                        };
                    } catch (error) {
                        console.warn('Failed to query quests store', error);
                        resolve(null);
                    }
                });

            return await lookupQuestId();
        },
        title,
        { timeout: timeoutMs }
    );

    const questId = await handle.jsonValue();

    if (questId == null || Number.isNaN(Number(questId))) {
        throw new Error(`Quest titled "${title}" not found in IndexedDB within ${timeoutMs}ms`);
    }

    return Number(questId);
}

/**
 * Utility functions to help with testing the DSpace application
 */

/**
 * Legacy alias maintained for existing specs.
 * Prefer {@link purgeClientState} for new tests.
 */
export async function clearUserData(page: Page): Promise<void> {
    await purgeClientState(page);
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
        await waitForHydration(page);

        // Generate a unique name
        const uniqueItemName = `Test Item ${i + 1}-${Date.now()}`;

        // Fill in the item form using id selectors
        await page.fill('#name', uniqueItemName);
        await page.fill('#description', `Test item ${i + 1} for automated testing`);

        // Submit the form with more flexible button selector
        const submitButton = page.locator('button.submit-button, input[type="submit"]');
        await submitButton.click();

        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');

        // Take a screenshot after submission
        await page.screenshot({ path: `./test-artifacts/screenshots/create-item-${i + 1}.png` });

        // Check for success by either finding success message or checking for redirect
        let viewUrl: string | null = null;

        try {
            // First try to find success message if present
            const successMessage = page.locator('.success-message, text=success, text=created');
            if (await successMessage.isVisible({ timeout: 5000 })) {
                // Try to find view button
                const viewButton = page.locator(
                    '.view-button, a:has-text("View"), button:has-text("View")'
                );
                if ((await viewButton.count()) > 0) {
                    viewUrl = await viewButton.getAttribute('href');

                    // Extract the item ID from the URL if possible
                    if (viewUrl) {
                        const id = viewUrl.split('/').pop();
                        if (id) {
                            itemIds.push(id);
                        }
                    }
                }
            }
        } catch (e) {
            // If no success message, we might have been redirected to inventory already
            console.log('No success message found, checking for redirect');
        }

        // If we couldn't extract an ID but the item was created, at least return something
        if (itemIds.length <= i) {
            itemIds.push(`unknown-item-${i + 1}-${Date.now()}`);
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
            await this.page.screenshot({
                path: './test-artifacts/screenshots/item-selector-before-click.png',
            });

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
 * Fills out a process form with given parameters
 * @returns Boolean indicating success
 */
export async function fillProcessForm(
    page: Page,
    title: string,
    duration: string,
    requiredItems = 0,
    consumedItems = 0,
    createdItems = 0
): Promise<boolean> {
    try {
        // Basic details with more flexible selectors
        const nameInput = page.locator('#name, #title').first();
        if ((await nameInput.count()) > 0) {
            await nameInput.fill(title);
            console.log('Filled process title');
        } else {
            console.log('Could not find name/title input');
        }

        const durationInput = page.locator('#duration');
        if ((await durationInput.count()) > 0) {
            await durationInput.fill(duration);
            console.log('Filled duration');
        } else {
            console.log('Could not find duration input');
        }

        // Screenshot after filling basic details
        await page.screenshot({
            path: './test-artifacts/screenshots/process-form-basic-details.png',
        });

        // Helper to add items of a specific type
        const addItems = async (type: 'required' | 'consumed' | 'created', count: number) => {
            // Different possible button text variations
            const buttonTexts = {
                required: ['Add Required Item', 'Add Requirement', 'Require Item'],
                consumed: ['Add Consumed Item', 'Add Consumption', 'Consume Item'],
                created: ['Add Created Item', 'Add Creation', 'Create Item'],
            };

            // Try different button selectors
            const possibleButtons = buttonTexts[type].map((text) =>
                page.locator(`button:has-text("${text}")`)
            );

            let foundButton = false;
            for (const buttonSelector of possibleButtons) {
                if ((await buttonSelector.count()) > 0) {
                    for (let i = 0; i < count; i++) {
                        await buttonSelector.click();
                        await page.waitForTimeout(300);
                        console.log(`Added ${type} item ${i + 1}`);

                        // Try to select an item from the dropdown or selector if one appears
                        await trySelectItem(page);
                    }
                    foundButton = true;
                    break;
                }
            }

            if (!foundButton && count > 0) {
                console.log(`Could not find button to add ${type} items`);
            }
        };

        // Add required, consumed, and created items as specified
        await addItems('required', requiredItems);
        await addItems('consumed', consumedItems);
        await addItems('created', createdItems);

        // Screenshot after adding all items
        await page.screenshot({
            path: './test-artifacts/screenshots/process-form-after-adding-items.png',
        });

        return true;
    } catch (e) {
        console.error('Error filling process form:', e);
        return false;
    }
}

/**
 * Helper to try selecting an item from a dropdown or selector
 */
async function trySelectItem(page: Page): Promise<boolean> {
    try {
        // Look for select elements or dropdown buttons that appeared
        const selectors = [
            page.locator('select').first(),
            page.locator('button:has-text("Select")').first(),
            page.locator('.item-selector').first(),
        ];

        for (const selector of selectors) {
            if ((await selector.count()) > 0 && (await selector.isVisible())) {
                // For select elements
                if ((await page.locator('select').count()) > 0) {
                    // Choose the second option (index 1) to avoid selecting placeholder
                    await page.locator('select').first().selectOption({ index: 1 });
                    return true;
                }

                // For buttons that open a dropdown
                await selector.click();
                await page.waitForTimeout(300);

                // Try to click the first item in any dropdown that appears
                const dropdownItems = [
                    page.locator('.dropdown-menu .item').first(),
                    page.locator('.item-list .item').first(),
                    page.locator('.selector-expanded .item').first(),
                    page.locator('[role="listbox"] [role="option"]').first(),
                ];

                for (const item of dropdownItems) {
                    if ((await item.count()) > 0 && (await item.isVisible())) {
                        await item.click();
                        return true;
                    }
                }
            }
        }
    } catch (e) {
        console.log('Error trying to select item:', e);
    }

    return false;
}

/**
 * Waits for Svelte component hydration to complete
 * @param page The Playwright page object
 * @param componentName Optional component name to look for in data-hydrated attributes
 */
export async function waitForHydration(page: Page, target?: string): Promise<void> {
    const selector = target
        ? target.startsWith('.') ||
          target.startsWith('#') ||
          target.startsWith('[') ||
          target.startsWith(':') ||
          target.startsWith('data-')
            ? target
            : `[data-hydrated="${target}"]`
        : '[data-hydrated="true"]';

    // Try waiting for an element that indicates hydration is complete
    try {
        await page.waitForSelector(selector, { timeout: 5000 });
    } catch (e) {
        // If we can't find a specific element, wait a bit to ensure hydration completes
        console.log(`Could not find hydration marker (${selector}), waiting for timeout`);
        await page.waitForTimeout(2000);
    }
}

/**
 * Adds test items to the inventory for testing purposes
 * Uses localStorage to directly inject items without using the UI
 */
export async function addTestItems(page: Page): Promise<void> {
    await page.goto('/');

    await page.evaluate(() => {
        // Get current inventory or initialize new one
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');

        // Add some basic test items with various properties
        if (!inventory.items) {
            inventory.items = {};
        }

        // Add a basic item
        inventory.items['test-item-1'] = {
            id: 'test-item-1',
            name: 'Test Item 1',
            description: 'A test item for testing',
            category: 'test',
            quantity: 10,
            value: 100,
            custom: true,
        };

        // Add another item with different properties
        inventory.items['test-item-2'] = {
            id: 'test-item-2',
            name: 'Test Item 2',
            description: 'Another test item',
            category: 'resources',
            quantity: 5,
            value: 200,
            custom: true,
        };

        // Add some currency for purchase tests
        if (!inventory.currency) {
            inventory.currency = 0;
        }
        inventory.currency += 500;

        // Save back to localStorage
        localStorage.setItem('inventory', JSON.stringify(inventory));
        console.log('Added test items to inventory');
    });
}
