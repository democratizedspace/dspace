import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __seedCustomItemPromise?: Promise<void>;
    }
}

test.describe('Custom item detail page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders custom item metadata and matching compact icon', async ({ page }) => {
        const customId = '2c5b1b6a-7c4d-4b55-91fd-0f5e1c3c0e2f';
        const customItem = {
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR4nGP8/58BAwMDAwMAAAUABW6pL9cAAAAASUVORK5CYII=',
        };

        await page.addInitScript(
            ({ item }) => {
                window.__seedCustomItemPromise = new Promise((resolve, reject) => {
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
                            reject(tx.error);
                        };
                    };

                    request.onerror = () => reject(request.error);
                });
            },
            { item: customItem }
        );

        await page.goto(`/inventory/item/${customId}`);
        await page.evaluate(() => window.__seedCustomItemPromise);
        await waitForHydration(page);

        const heading = page.locator('[data-testid="item-hero-title"]');
        await expect(heading).toContainText('foobar');

        const heroImage = page.locator('[data-testid="item-hero-image"]');
        await expect(heroImage).toBeVisible();
        const heroSrc = await heroImage.getAttribute('src');

        expect(heroSrc).toContain('data:image/png');
        expect(heroSrc).not.toContain('/assets/logo.png');

        const listIcon = page.locator('[data-testid="item-compact-list"] img.icon');
        await expect(listIcon).toBeVisible();
        await expect(listIcon).toHaveAttribute('src', heroSrc ?? '');
    });

    test('renders built-in item details', async ({ page }) => {
        const builtInId = '83fe7eee-135e-4885-9ce0-9042b9fb860a';
        await page.goto(`/inventory/item/${builtInId}`);
        await waitForHydration(page);

        const heading = page.locator('[data-testid="item-hero-title"]');
        await expect(heading).toContainText('aquarium (150 L)');

        const heroImage = page.locator('[data-testid="item-hero-image"]');
        await expect(heroImage).toHaveAttribute('src', /\/assets\/aquarium_empty\.jpg/);
    });
});
