import { expect, test } from '@playwright/test';
import items from '../src/pages/inventory/json/items/index.js';
import { waitForHydration } from './test-helpers';
import { purgeClientStorage } from './utils/idb';

test.describe('Custom item detail view', () => {
    const customId = 'custom-item-foobar';
    const customImage =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const customItem = {
        id: customId,
        name: 'foobar',
        description: 'foo bar baz',
        image: customImage,
        entityType: 'item',
        custom: true,
        createdAt: new Date().toISOString(),
    };

    test.beforeEach(async ({ page }) => {
        await purgeClientStorage(page);
    });

    test('renders custom item metadata and icon on detail page', async ({ page }) => {
        await page.goto('/');
        await waitForHydration(page);
        await page.evaluate(async (item) => {
            await new Promise<void>((resolve) => {
                const request = indexedDB.open('CustomContent', 3);

                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('meta')) {
                        db.createObjectStore('meta');
                    }
                    if (!db.objectStoreNames.contains('items')) {
                        db.createObjectStore('items', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('processes')) {
                        db.createObjectStore('processes', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('quests')) {
                        db.createObjectStore('quests', { keyPath: 'id' });
                    }
                };

                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction('items', 'readwrite');
                    tx.objectStore('items').put(item);
                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                    tx.onerror = () => {
                        db.close();
                        resolve();
                    };
                };

                request.onerror = () => resolve();
                request.onblocked = () => resolve();
            });
        }, customItem);

        await page.goto(`/inventory/item/${customId}`);
        await waitForHydration(page);
        await expect(page.getByRole('heading', { level: 2, name: 'foobar' })).toBeVisible();

        const heroImage = page.locator('img:not(.icon)').first();
        const iconImage = page.locator('img.icon').first();

        await expect(heroImage).toHaveAttribute('src', customItem.image);
        await expect(iconImage).toHaveAttribute('src', customItem.image);
    });

    test('still renders built-in items on detail page', async ({ page }) => {
        const builtIn = items.find((item) => item.image) ?? items[0];

        await page.goto(`/inventory/item/${builtIn.id}`);
        await waitForHydration(page);
        await expect(
            page.getByRole('heading', { level: 2, name: builtIn.name })
        ).toBeVisible();

        const heroImage = page.locator('img:not(.icon)').first();
        const iconImage = page.locator('img.icon').first();

        await expect(heroImage).toHaveAttribute('src', builtIn.image);
        await expect(iconImage).toHaveAttribute('src', builtIn.image);
    });
});
