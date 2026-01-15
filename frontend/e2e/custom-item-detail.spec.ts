import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILT_IN_ITEMS_PATH = path.join(
    __dirname,
    '..',
    'src',
    'pages',
    'inventory',
    'json',
    'items',
    'misc.json'
);

const builtInItems = JSON.parse(readFileSync(BUILT_IN_ITEMS_PATH, 'utf-8')) as Array<{
    id: string;
    name: string;
}>;

const builtInSample = builtInItems[0];

test.describe('Custom item detail page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders custom item name and image on item detail page', async ({ page }) => {
        const customId = 'custom-item-detail-foobar';
        const customImage =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        await page.evaluate(
            async ({ id, image }) => {
                const openRequest = indexedDB.open('CustomContent', 3);
                const db: IDBDatabase = await new Promise((resolve, reject) => {
                    openRequest.onerror = () => reject(openRequest.error);
                    openRequest.onupgradeneeded = () => resolve(openRequest.result);
                    openRequest.onsuccess = () => resolve(openRequest.result);
                });

                try {
                    if (!db.objectStoreNames.contains('items')) {
                        db.close();
                        return;
                    }

                    await new Promise<void>((resolve, reject) => {
                        const tx = db.transaction('items', 'readwrite');
                        const store = tx.objectStore('items');
                        store.put({
                            id,
                            name: 'foobar',
                            description: 'foo bar baz',
                            image,
                            custom: true,
                            entityType: 'item',
                        });
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject(tx.error);
                    });
                } finally {
                    db.close();
                }
            },
            { id: customId, image: customImage }
        );

        await page.goto(`/inventory/item/${customId}`);
        await waitForHydration(page);

        const heading = page.getByRole('heading', { level: 2 });
        await expect(heading).toContainText('foobar');
        await expect(heading).not.toContainText(customId);

        const heroImage = page.locator('img[alt="foobar"]');
        await expect(heroImage).toBeVisible();
        const heroSrc = await heroImage.getAttribute('src');
        expect(heroSrc).toContain('data:image/png');

        const iconImage = page.locator('img.icon').first();
        await expect(iconImage).toBeVisible();
        const iconSrc = await iconImage.getAttribute('src');
        expect(iconSrc).toBe(heroSrc);

        await page.goto(`/inventory/item/${builtInSample.id}`);
        await waitForHydration(page);
        await expect(page.getByRole('heading', { level: 2 })).toContainText(builtInSample.name);
    });
});
