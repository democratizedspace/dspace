import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';
import items from '../src/pages/inventory/json/items/index.js';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Custom item detail metadata', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders custom and built-in item names and images', async ({ page }) => {
        const customId = randomUUID();
        const customImage =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

        await page.addInitScript(
            ({ id, name, description, image }) => {
                const openRequest = indexedDB.open('CustomContent');
                openRequest.onupgradeneeded = () => {
                    const db = openRequest.result;
                    if (!db.objectStoreNames.contains('items')) {
                        db.createObjectStore('items', { keyPath: 'id' });
                    }
                };
                openRequest.onsuccess = () => {
                    const db = openRequest.result;
                    const tx = db.transaction('items', 'readwrite');
                    const store = tx.objectStore('items');
                    store.put({
                        id,
                        name,
                        description,
                        image,
                        custom: true,
                        entityType: 'item',
                    });
                    tx.oncomplete = () => db.close();
                    tx.onerror = () => db.close();
                };
            },
            {
                id: customId,
                name: 'foobar',
                description: 'foo bar baz',
                image: customImage,
            }
        );

        await page.goto('/');
        await page.waitForFunction(async (itemId) => {
            const openRequest = indexedDB.open('CustomContent');
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result);
                openRequest.onerror = () => reject(openRequest.error);
                openRequest.onupgradeneeded = () => resolve(openRequest.result);
            });

            try {
                if (!db.objectStoreNames.contains('items')) {
                    return false;
                }
                const tx = db.transaction('items', 'readonly');
                const store = tx.objectStore('items');
                const request = store.get(itemId);
                return await new Promise<boolean>((resolve) => {
                    request.onsuccess = () => resolve(Boolean(request.result));
                    request.onerror = () => resolve(false);
                });
            } finally {
                db.close();
            }
        }, customId);

        await page.goto(`/inventory/item/${customId}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { level: 2 })).toHaveText('foobar');

        const heroImage = page.locator('.vertical > img');
        const heroSrc = await heroImage.getAttribute('src');
        expect(heroSrc).toBe(customImage);

        const iconImage = page.locator('.Container img.icon');
        const iconSrc = await iconImage.getAttribute('src');
        expect(iconSrc).toBe(customImage);

        const builtInItem = items[0];
        await page.goto(`/inventory/item/${builtInItem.id}`);
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByRole('heading', { level: 2 })).toHaveText(builtInItem.name);
        const builtInHeroSrc = await page.locator('.vertical > img').getAttribute('src');
        expect(builtInHeroSrc).toContain(builtInItem.image);
    });
});
