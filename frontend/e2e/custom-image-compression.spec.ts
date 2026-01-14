import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

const MAX_BYTES = 52 * 1024;

async function uploadLargeImage(page, inputSelector, seed) {
    const input = page.locator(inputSelector);
    await expect(input).toBeVisible();

    await page.evaluate(
        async ({ selector, seedValue }) => {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error('File input not found');
            }
            const canvas = document.createElement('canvas');
            canvas.width = 2500;
            canvas.height = 1800;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas not supported');
            }

            const imageData = ctx.createImageData(canvas.width, canvas.height);
            let seed = seedValue;

            for (let i = 0; i < imageData.data.length; i += 4) {
                seed = (seed * 16807) % 2147483647;
                const value = seed % 256;
                imageData.data[i] = value;
                imageData.data[i + 1] = (value * 3) % 256;
                imageData.data[i + 2] = (value * 7) % 256;
                imageData.data[i + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);

            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, 'image/png', 1.0)
            );
            if (!blob) {
                throw new Error('Failed to create test image');
            }

            const file = new File([blob], 'noise.png', { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            element.files = dataTransfer.files;
            element.dispatchEvent(new Event('change', { bubbles: true }));
        },
        { selector: inputSelector, seedValue: seed }
    );
}

async function waitForCustomRecord(page, storeName, fieldName, fieldValue) {
    const handle = await page.waitForFunction(
        async ({ store, field, value }) => {
            const openRequest = indexedDB.open('CustomContent');
            const db = await new Promise((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result);
                openRequest.onerror = () => reject(openRequest.error);
                openRequest.onupgradeneeded = () => resolve(openRequest.result);
            });

            try {
                if (!db.objectStoreNames.contains(store)) {
                    return null;
                }
                const tx = db.transaction(store, 'readonly');
                const request = tx.objectStore(store).getAll();
                const records = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                return (
                    records.find((record) => {
                        const recordValue = (record?.[field] ?? '')
                            .toString()
                            .trim()
                            .toLowerCase();
                        const expectedValue = value.trim().toLowerCase();
                        return recordValue === expectedValue;
                    }) ?? null
                );
            } finally {
                db.close();
            }
        },
        { store: storeName, field: fieldName, value: fieldValue },
        { timeout: 15000 }
    );

    return handle.jsonValue();
}

async function readImageMetrics(page, dataUrl) {
    return page.evaluate(async (url) => {
        const base64 = url.split(',')[1] ?? '';
        const bytes = atob(base64).length;

        const image = new Image();
        const loaded = new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Failed to load image'));
        });
        image.src = url;
        await loaded;

        return {
            bytes,
            width: image.naturalWidth,
            height: image.naturalHeight,
            isJpeg: url.startsWith('data:image/jpeg'),
        };
    }, dataUrl);
}

test.describe('Custom image compression', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('compresses custom item images on create and edit', async ({ page }) => {
        await page.goto('/inventory/create');
        await waitForHydration(page);

        const itemName = `Compressed Item ${Date.now()}`;
        await page.fill('#name', itemName);
        await page.fill('#description', 'Large image test item.');

        await uploadLargeImage(page, 'input[type="file"]', 1337);
        await expect(page.locator('.image-preview')).toBeVisible();

        await page.click('button.submit-button');

        const itemRecord = await waitForCustomRecord(page, 'items', 'name', itemName);
        expect(itemRecord).toBeTruthy();

        const initialImage = itemRecord.image;
        const metrics = await readImageMetrics(page, initialImage);
        expect(metrics.isJpeg).toBe(true);
        expect(metrics.bytes).toBeLessThanOrEqual(MAX_BYTES);
        expect(metrics.width).toBe(metrics.height);
        expect(metrics.width).toBeLessThanOrEqual(512);
        expect(metrics.width).toBeGreaterThanOrEqual(256);

        await page.goto(`/inventory/item/${itemRecord.id}/edit`);
        await waitForHydration(page);

        await uploadLargeImage(page, 'input[type="file"]', 4242);
        await page.click('button.submit-button');

        const updatedRecord = await page.waitForFunction(
            async ({ name, previous }) => {
                const openRequest = indexedDB.open('CustomContent');
                const db = await new Promise((resolve, reject) => {
                    openRequest.onsuccess = () => resolve(openRequest.result);
                    openRequest.onerror = () => reject(openRequest.error);
                    openRequest.onupgradeneeded = () => resolve(openRequest.result);
                });

                try {
                    if (!db.objectStoreNames.contains('items')) {
                        return null;
                    }
                    const tx = db.transaction('items', 'readonly');
                    const request = tx.objectStore('items').getAll();
                    const records = await new Promise((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });

                    const match = records.find((record) => {
                        const recordName = (record?.name ?? '')
                            .toString()
                            .trim()
                            .toLowerCase();
                        const expectedName = name.trim().toLowerCase();
                        return recordName === expectedName;
                    });

                    if (match?.image && match.image !== previous) {
                        return match;
                    }

                    return null;
                } finally {
                    db.close();
                }
            },
            { name: itemName, previous: initialImage },
            { timeout: 15000 }
        );

        const updated = await updatedRecord.jsonValue();
        const updatedMetrics = await readImageMetrics(page, updated.image);
        expect(updatedMetrics.isJpeg).toBe(true);
        expect(updatedMetrics.bytes).toBeLessThanOrEqual(MAX_BYTES);
        expect(updatedMetrics.width).toBe(updatedMetrics.height);
        expect(updatedMetrics.width).toBeLessThanOrEqual(512);
        expect(updatedMetrics.width).toBeGreaterThanOrEqual(256);
    });

    test('compresses custom quest images on create and edit', async ({ page }) => {
        await page.goto('/quests/create');
        await waitForHydration(page);

        const questTitle = `Compressed Quest ${Date.now()}`;
        await page.fill('#title', questTitle);
        await page.fill('#description', 'Large image test quest description.');

        await uploadLargeImage(page, 'input[type="file"]', 2024);
        await expect(page.locator('.image-preview')).toBeVisible();

        await page.click('button.submit-button');

        const questRecord = await waitForCustomRecord(page, 'quests', 'title', questTitle);
        expect(questRecord).toBeTruthy();

        const initialImage = questRecord.image;
        const metrics = await readImageMetrics(page, initialImage);
        expect(metrics.isJpeg).toBe(true);
        expect(metrics.bytes).toBeLessThanOrEqual(MAX_BYTES);
        expect(metrics.width).toBe(metrics.height);
        expect(metrics.width).toBeLessThanOrEqual(512);
        expect(metrics.width).toBeGreaterThanOrEqual(256);

        await page.goto(`/quests/${questRecord.id}/edit`);
        await waitForHydration(page);

        await uploadLargeImage(page, 'input[type="file"]', 9090);
        await page.click('button.submit-button');

        const updatedRecord = await page.waitForFunction(
            async ({ title, previous }) => {
                const openRequest = indexedDB.open('CustomContent');
                const db = await new Promise((resolve, reject) => {
                    openRequest.onsuccess = () => resolve(openRequest.result);
                    openRequest.onerror = () => reject(openRequest.error);
                    openRequest.onupgradeneeded = () => resolve(openRequest.result);
                });

                try {
                    if (!db.objectStoreNames.contains('quests')) {
                        return null;
                    }
                    const tx = db.transaction('quests', 'readonly');
                    const request = tx.objectStore('quests').getAll();
                    const records = await new Promise((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });

                    const match = records.find((record) => {
                        const recordTitle = (record?.title ?? '')
                            .toString()
                            .trim()
                            .toLowerCase();
                        const expectedTitle = title.trim().toLowerCase();
                        return recordTitle === expectedTitle;
                    });

                    if (match?.image && match.image !== previous) {
                        return match;
                    }

                    return null;
                } finally {
                    db.close();
                }
            },
            { title: questTitle, previous: initialImage },
            { timeout: 15000 }
        );

        const updated = await updatedRecord.jsonValue();
        const updatedMetrics = await readImageMetrics(page, updated.image);
        expect(updatedMetrics.isJpeg).toBe(true);
        expect(updatedMetrics.bytes).toBeLessThanOrEqual(MAX_BYTES);
        expect(updatedMetrics.width).toBe(updatedMetrics.height);
        expect(updatedMetrics.width).toBeLessThanOrEqual(512);
        expect(updatedMetrics.width).toBeGreaterThanOrEqual(256);
    });
});
