import { expect, test } from '@playwright/test';
import items from '../src/pages/inventory/json/items/index.js';
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
        await page.addInitScript(({ item }) => {
            window['__customItemSeeded'] = false;
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
                    window['__customItemSeeded'] = true;
                    db.close();
                };
                tx.onerror = () => {
                    window['__customItemSeeded'] = true;
                    db.close();
                };
            };
        }, { item: customItem });

        await page.goto(`/inventory/item/${customId}`);
        await page.waitForFunction(() => window['__customItemSeeded'] === true);
        await page.waitForSelector('h2');

        await expect(page.getByRole('heading', { level: 2 })).toHaveText('foobar');

        const heroImage = page.locator('img:not(.icon)').first();
        const iconImage = page.locator('img.icon').first();

        await expect(heroImage).toHaveAttribute('src', customItem.image);
        await expect(iconImage).toHaveAttribute('src', customItem.image);
    });

    test('still renders built-in items on detail page', async ({ page }) => {
        const builtIn = items.find((item) => item.image) ?? items[0];

        await page.goto(`/inventory/item/${builtIn.id}`);
        await page.waitForSelector('h2');

        await expect(page.getByRole('heading', { level: 2 })).toHaveText(builtIn.name);
        await expect(page.locator('img:not(.icon)').first()).toHaveAttribute(
            'src',
            builtIn.image
        );
    });
});
