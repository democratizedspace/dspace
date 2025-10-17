import { Page, Locator, expect } from '@playwright/test';

import { ITEM_SELECTOR_OPTION_LOCATORS } from './utils/itemSelectors';

/**
 * Utility functions to help with testing the DSpace application
 */

export async function purgeClientState(page: Page): Promise<void> {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();

        const targets = ['CustomContent', 'dspaceGameState', 'dspaceDB', 'dspaceGameSaves'];
        const anyIndexedDB = indexedDB as unknown as {
            databases?: () => Promise<Array<{ name?: string | null }>>;
        };

        try {
            const module = await import('/src/utils/gameState/common.js');
            await module.closeGameStateDatabaseForTesting?.();
        } catch (error) {
            console.warn('Failed to close game state database before purge:', error);
        }

        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const clearObjectStores = async (name: string) => {
            try {
                await new Promise<void>((resolve) => {
                    const openRequest = indexedDB.open(name);
                    openRequest.onerror = () => resolve();
                    openRequest.onsuccess = () => {
                        const db = openRequest.result;
                        const stores = Array.from(db.objectStoreNames);

                        if (stores.length === 0) {
                            db.close();
                            resolve();
                            return;
                        }

                        const tx = db.transaction(stores, 'readwrite');
                        stores.forEach((store) => {
                            tx.objectStore(store).clear();
                        });
                        tx.oncomplete = () => {
                            db.close();
                            resolve();
                        };
                        tx.onerror = () => {
                            db.close();
                            resolve();
                        };
                    };
                });
            } catch (error) {
                console.warn('Failed to clear object stores for database', name, error);
            }
        };

        await Promise.all(
            targets.map((name) =>
                (async () => {
                    let blocked = false;
                    try {
                        await new Promise<void>((resolve) => {
                            const request = indexedDB.deleteDatabase(name);
                            request.onsuccess = () => resolve();
                            request.onerror = () => resolve();
                            request.onblocked = () => {
                                blocked = true;
                                resolve();
                            };
                        });
                    } catch (error) {
                        console.warn('Failed to delete database', name, error);
                    }

                    if (!blocked || !anyIndexedDB?.databases) {
                        return;
                    }

                    const timeoutAt = Date.now() + 2_000;
                    while (Date.now() < timeoutAt) {
                        const databases = await anyIndexedDB.databases();
                        if (!databases.some((db) => db?.name === name)) {
                            return;
                        }
                        await sleep(50);
                    }

                    await clearObjectStores(name);
                })()
            )
        );
    });

    const waitTargets = ['CustomContent', 'dspaceGameState', 'dspaceDB', 'dspaceGameSaves'];
    await page.waitForFunction(
        async ({ names }) => {
            const anyIndexedDB = indexedDB as unknown as {
                databases?: () => Promise<Array<{ name?: string | null }>>;
            };

            if (!anyIndexedDB || typeof anyIndexedDB.databases !== 'function') {
                return true;
            }

            const databases = await anyIndexedDB.databases();
            return names.every((name: string) => !databases.some((db) => db?.name === name));
        },
        { names: waitTargets }
    );
}

/**
 * Clears persisted user data for backwards compatibility with older helpers.
 */
export async function clearUserData(page: Page): Promise<void> {
    await purgeClientState(page);
}

export async function waitForQuestRecordByTitle(
    page: Page,
    title: string,
    { timeoutMs = 15_000 }: { timeoutMs?: number } = {}
): Promise<number> {
    const resultHandle = await page.waitForFunction(
        async ({ questTitle }) => {
            const openRequest = indexedDB.open('CustomContent');
            const db: IDBDatabase = await new Promise((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result);
                openRequest.onerror = () => reject(openRequest.error);
                openRequest.onupgradeneeded = () => resolve(openRequest.result);
            });

            try {
                if (!db.objectStoreNames.contains('quests')) {
                    return null;
                }
                const tx = db.transaction('quests', 'readonly');
                const store = tx.objectStore('quests');
                const request = store.getAll();

                const quests = await new Promise<Array<{ id?: unknown; title?: string }>>(
                    (resolve, reject) => {
                        request.onsuccess = () =>
                            resolve(request.result as Array<{ id?: unknown; title?: string }>);
                        request.onerror = () => reject(request.error);
                    }
                );

                const normalizedTitle = questTitle.trim().toLowerCase();
                const match = quests.find(
                    (quest) => (quest?.title ?? '').trim().toLowerCase() === normalizedTitle
                );
                if (!match) {
                    return null;
                }

                const idCandidate =
                    (match as Record<string, unknown>).id ??
                    (match as Record<string, unknown>).questId ??
                    (match as Record<string, unknown>).questID ??
                    (match as Record<string, unknown>).key ??
                    (match as Record<string, unknown>).primaryKey;

                return idCandidate ?? null;
            } finally {
                db.close();
            }
        },
        { questTitle: title },
        { timeout: timeoutMs }
    );

    const rawId = await resultHandle.jsonValue<unknown>();
    return Number(rawId);
}

async function customQuestExists(page: Page, questTitle: string): Promise<boolean> {
    return page.evaluate(async (title) => {
        const openRequest = indexedDB.open('CustomContent');
        const db: IDBDatabase = await new Promise((resolve, reject) => {
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
            openRequest.onupgradeneeded = () => resolve(openRequest.result);
        });

        try {
            if (!db.objectStoreNames.contains('quests')) {
                return false;
            }

            const tx = db.transaction('quests', 'readonly');
            const store = tx.objectStore('quests');
            const request = store.getAll();

            const quests = await new Promise<Array<{ title?: string }>>((resolve, reject) => {
                request.onsuccess = () => resolve(request.result as Array<{ title?: string }>);
                request.onerror = () => reject(request.error);
            });

            const normalizedTitle = title.trim().toLowerCase();
            return quests.some(
                (quest) => (quest.title ?? '').trim().toLowerCase() === normalizedTitle
            );
        } finally {
            db.close();
        }
    }, questTitle);
}

export async function expectQuestIndexedDbState(
    page: Page,
    questTitle: string,
    { present, timeoutMs = 10_000 }: { present: boolean; timeoutMs?: number }
): Promise<void> {
    await expect
        .poll(async () => await customQuestExists(page, questTitle), { timeout: timeoutMs })
        .toBe(present);
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
        const expansionLocator = container.locator('.selector-expanded, .items-list');

        // If either is visible, consider it expanded
        if ((await expandedView.count()) > 0 || (await itemsList.count()) > 0) {
            console.log('Item selector already expanded');
            await expect(expansionLocator.first()).toBeVisible();
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

            await expect(expansionLocator.first()).toBeVisible();
            return true;
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

            // Wait for selection to take effect (selector should collapse)
            await expect
                .poll(
                    async () => await container.locator('.selector-expanded, .items-list').count()
                )
                .toBe(0);
            return true;
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
                        console.log(`Added ${type} item ${i + 1}`);

                        // Try to select an item from the dropdown or selector if one appears
                        await expect.poll(async () => await trySelectItem(page)).toBe(true);
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
        const selectElement = page.locator('select').first();
        if ((await selectElement.count()) > 0 && (await selectElement.isVisible())) {
            await selectElement.selectOption({ index: 1 });
            return true;
        }

        const selectButton = page.locator('button:has-text("Select")').first();
        if ((await selectButton.count()) > 0 && (await selectButton.isVisible())) {
            await selectButton.click();
            const dropdownItem = page.locator(ITEM_SELECTOR_OPTION_LOCATORS.join(', ')).first();
            await expect(dropdownItem).toBeVisible();
            await dropdownItem.click();
            return true;
        }

        const itemSelectors = page.locator('.item-selector');
        if ((await itemSelectors.count()) > 0) {
            const target = itemSelectors.last();
            await expect(target).toHaveAttribute('data-hydrated', 'true');

            const toggle = target.locator('button.select-button, button.edit-button');
            if ((await toggle.count()) > 0 && (await toggle.first().isVisible())) {
                await toggle.first().click();
            }

            const dropdownItem = target.locator(ITEM_SELECTOR_OPTION_LOCATORS.join(', ')).first();
            await expect(dropdownItem).toBeVisible();
            await dropdownItem.click();
            return true;
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
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('main')).toBeVisible();

    if (target) {
        const locator = target.startsWith('data-testid=')
            ? page.getByTestId(target.replace('data-testid=', '').trim())
            : page.locator(target);
        await expect(locator).toBeVisible();
        return;
    }

    const hydratedMarker = page.locator('[data-hydrated="true"]');
    if ((await hydratedMarker.count()) > 0) {
        await expect(hydratedMarker.first()).toBeVisible();
    }
}

export async function expectLocalStorageCleared(page: Page, key: string): Promise<void> {
    await expect
        .poll(async () => page.evaluate((candidate) => localStorage.getItem(candidate), key))
        .toBeNull();
}

export async function expectLocalStorageValue(
    page: Page,
    key: string,
    expected: string | RegExp | null
): Promise<void> {
    const poller = expect
        .poll(async () => page.evaluate((candidate) => localStorage.getItem(candidate), key))
        .setTimeout(5_000);

    if (expected === null) {
        await poller.toBeNull();
        return;
    }

    if (expected instanceof RegExp) {
        await poller.toMatch(expected);
        return;
    }

    await poller.toBe(expected);
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

type Hookable = {
    beforeEach: (fn: ({ page }: { page: Page }) => Promise<void>) => void;
    afterEach: (fn: ({ page }: { page: Page }) => Promise<void>) => void;
};

export function registerClientStateHooks(testApi: Hookable): void {
    testApi.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    testApi.afterEach(async ({ page }) => {
        await purgeClientState(page);
    });
}
