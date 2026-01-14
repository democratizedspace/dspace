import { expect, test, type Page } from '@playwright/test';
import { clearUserData } from './test-helpers';

const MAX_BYTES = 52 * 1024;
const JPEG_PREFIX = 'data:image/jpeg';

async function uploadSyntheticImage(
    page: Page,
    selector: string,
    {
        width = 1600,
        height = 1200,
        seed = 1337,
    }: { width?: number; height?: number; seed?: number } = {}
) {
    await page.evaluate(
        async ({ selector: inputSelector, width: imgWidth, height: imgHeight, seed: seedValue }) => {
            const input = document.querySelector(inputSelector);
            if (!input) {
                throw new Error(`Missing input: ${inputSelector}`);
            }

            const canvas = document.createElement('canvas');
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context unavailable');
            }

            const imageData = ctx.createImageData(imgWidth, imgHeight);
            const data = imageData.data;
            let state = seedValue;

            for (let i = 0; i < data.length; i += 4) {
                state = (state * 1664525 + 1013904223) % 4294967296;
                const value = state & 0xff;
                data[i] = value;
                data[i + 1] = (state >> 8) & 0xff;
                data[i + 2] = (state >> 16) & 0xff;
                data[i + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);

            const blob = await new Promise((resolve) =>
                canvas.toBlob((result) => resolve(result), 'image/png')
            );

            if (!blob) {
                throw new Error('Failed to generate image blob');
            }

            const file = new File([blob], 'custom-upload.png', { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        },
        { selector, width, height, seed }
    );
}

async function waitForRecord(
    page: Page,
    storeName: string,
    field: string,
    value: string
) {
    await page.waitForFunction(
        async ({ store, matchField, matchValue }) => {
            const openRequest = indexedDB.open('CustomContent');
            const db = await new Promise((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result);
                openRequest.onerror = () => reject(openRequest.error);
                openRequest.onupgradeneeded = () => resolve(openRequest.result);
            });

            try {
                if (!db.objectStoreNames.contains(store)) {
                    return false;
                }

                const tx = db.transaction(store, 'readonly');
                const storeRef = tx.objectStore(store);
                const request = storeRef.getAll();
                const records = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                const normalized = String(matchValue).trim().toLowerCase();
                return records.some(
                    (record) =>
                        String(record?.[matchField] ?? '').trim().toLowerCase() === normalized
                );
            } finally {
                db.close();
            }
        },
        { store: storeName, matchField: field, matchValue: value },
        { timeout: 15000 }
    );
}

async function getRecord(
    page: Page,
    storeName: string,
    field: string,
    value: string
) {
    return page.evaluate(
        async ({ store, matchField, matchValue }) => {
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
                const storeRef = tx.objectStore(store);
                const request = storeRef.getAll();
                const records = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                const normalized = String(matchValue).trim().toLowerCase();
                return (
                    records.find(
                        (record) =>
                            String(record?.[matchField] ?? '').trim().toLowerCase() === normalized
                    ) ?? null
                );
            } finally {
                db.close();
            }
        },
        { store: storeName, matchField: field, matchValue: value }
    );
}

async function getImageStats(page: Page, dataUrl: string) {
    return page.evaluate(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const stats = { bytes: blob.size, width: bitmap.width, height: bitmap.height };
        if (typeof bitmap.close === 'function') {
            bitmap.close();
        }
        return stats;
    }, dataUrl);
}

function expectCompressedImage(
    dataUrl: string,
    stats: { bytes: number; width: number; height: number }
) {
    expect(dataUrl.startsWith(JPEG_PREFIX)).toBe(true);
    expect(stats.width).toBe(512);
    expect(stats.height).toBe(512);
    expect(stats.bytes).toBeLessThanOrEqual(MAX_BYTES);
}

test.describe('Custom image compression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('compresses custom item images on create and edit', async ({ page }) => {
        const itemName = `Compressed Item ${Date.now()}`;

        await page.goto('/inventory/create');
        await page.fill('#name', itemName);
        await page.fill('#description', 'Compression test item.');
        await uploadSyntheticImage(page, '#image', { seed: 101 });

        await expect(page.locator('.image-preview')).toBeVisible();
        await page.click('button.submit-button');

        await waitForRecord(page, 'items', 'name', itemName);
        const createdRecord = await getRecord(page, 'items', 'name', itemName);

        expect(createdRecord).toBeTruthy();
        const createdImage = createdRecord?.image ?? '';
        const createdStats = await getImageStats(page, createdImage);
        expectCompressedImage(createdImage, createdStats);

        const itemId = createdRecord?.id;
        expect(itemId).toBeTruthy();

        await page.goto(`/inventory/item/${itemId}/edit`);
        await uploadSyntheticImage(page, '#image', { seed: 202 });
        await expect(page.locator('.image-preview')).toBeVisible();
        await page.click('button.submit-button');

        await waitForRecord(page, 'items', 'name', itemName);
        const updatedRecord = await getRecord(page, 'items', 'name', itemName);
        const updatedImage = updatedRecord?.image ?? '';
        const updatedStats = await getImageStats(page, updatedImage);

        expect(updatedImage).not.toBe(createdImage);
        expectCompressedImage(updatedImage, updatedStats);
    });

    test('compresses custom quest images on create and edit', async ({ page }) => {
        const questTitle = `Compressed Quest ${Date.now()}`;

        await page.goto('/quests/create');
        await page.fill('#title', questTitle);
        await page.fill('#description', 'Compression test quest.');
        await uploadSyntheticImage(page, '#image', { seed: 303 });

        await expect(page.locator('.image-preview')).toBeVisible();
        await page.click('button.submit-button');

        await waitForRecord(page, 'quests', 'title', questTitle);
        const createdRecord = await getRecord(page, 'quests', 'title', questTitle);

        expect(createdRecord).toBeTruthy();
        const createdImage = createdRecord?.image ?? '';
        const createdStats = await getImageStats(page, createdImage);
        expectCompressedImage(createdImage, createdStats);

        const questId = createdRecord?.id;
        expect(questId).toBeTruthy();

        await page.goto(`/quests/${questId}/edit`);
        await uploadSyntheticImage(page, '#image', { seed: 404 });
        await expect(page.locator('.image-preview')).toBeVisible();
        await page.click('button.submit-button');

        await waitForRecord(page, 'quests', 'title', questTitle);
        const updatedRecord = await getRecord(page, 'quests', 'title', questTitle);
        const updatedImage = updatedRecord?.image ?? '';
        const updatedStats = await getImageStats(page, updatedImage);

        expect(updatedImage).not.toBe(createdImage);
        expectCompressedImage(updatedImage, updatedStats);
    });
});
