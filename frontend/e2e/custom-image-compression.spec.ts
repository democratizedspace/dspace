import { test, expect, Page } from '@playwright/test';
import { clearUserData } from './test-helpers';

const MAX_BYTES = 52 * 1024;
const MAX_DIMENSION = 512;
const MIN_DIMENSION = 256;

type GeneratedImageStyle = 'noise' | 'solid';

async function generatePngDataUrl(page: Page, seed: number, style: GeneratedImageStyle) {
    return page.evaluate(async ({ seedValue, imageStyle }) => {
        const width = 1600;
        const height = 1200;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context unavailable');
        }

        if (imageStyle === 'solid') {
            const hue = seedValue % 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx.fillRect(0, 0, width, height);
        } else {
            const imageData = ctx.createImageData(width, height);
            let state = seedValue;
            const nextByte = () => {
                state = (state * 1664525 + 1013904223) % 4294967296;
                return state & 0xff;
            };

            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = nextByte();
                imageData.data[i + 1] = nextByte();
                imageData.data[i + 2] = nextByte();
                imageData.data[i + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);
        }

        return canvas.toDataURL('image/png');
    }, { seedValue: seed, imageStyle: style });
}

async function uploadGeneratedImage(page: Page, seed: number, style: GeneratedImageStyle) {
    const dataUrl = await generatePngDataUrl(page, seed, style);
    const base64Payload = dataUrl.split(',')[1] ?? '';
    const buffer = Buffer.from(base64Payload, 'base64');

    let input = page.getByTestId('image-file-input');
    if ((await input.count()) === 0) {
        input = page.locator('input[type="file"]').first();
    }

    await input.setInputFiles({
        name: `${style}-${seed}.png`,
        mimeType: 'image/png',
        buffer,
    });

    await expect(page.locator('.image-preview')).toBeVisible();
}

async function getCustomContentRecord(
    page: Page,
    storeName: 'items' | 'quests',
    field: 'name' | 'title',
    value: string
) {
    return page.evaluate(
        async ({ storeName, field, value }) => {
            const openRequest = indexedDB.open('CustomContent');
            const db: IDBDatabase = await new Promise((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result);
                openRequest.onerror = () => reject(openRequest.error);
                openRequest.onupgradeneeded = () => resolve(openRequest.result);
            });

            try {
                if (!db.objectStoreNames.contains(storeName)) {
                    return null;
                }
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.getAll();
                const records = await new Promise<Array<Record<string, unknown>>>(
                    (resolve, reject) => {
                        request.onsuccess = () =>
                            resolve(request.result as Array<Record<string, unknown>>);
                        request.onerror = () => reject(request.error);
                    }
                );
                const normalized = value.trim().toLowerCase();
                return (
                    records.find(
                        (record) =>
                            String(record?.[field] ?? '')
                                .trim()
                                .toLowerCase() === normalized
                    ) ?? null
                );
            } finally {
                db.close();
            }
        },
        { storeName, field, value }
    );
}

async function getImageMetrics(page: Page, dataUrl: string) {
    return page.evaluate(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        let width = 0;
        let height = 0;

        if ('createImageBitmap' in window) {
            const bitmap = await createImageBitmap(blob);
            width = bitmap.width;
            height = bitmap.height;
            bitmap.close?.();
        } else {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    width = img.naturalWidth || img.width;
                    height = img.naturalHeight || img.height;
                    resolve();
                };
                img.onerror = () => reject(new Error('Failed to decode image'));
                img.src = url;
            });
        }

        return { bytes: blob.size, width, height };
    }, dataUrl);
}

function expectCompressedImage(metrics: { bytes: number; width: number; height: number }) {
    expect(metrics.bytes).toBeLessThanOrEqual(MAX_BYTES);
    expect(metrics.width).toBe(metrics.height);
    expect(metrics.width).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(metrics.width).toBeGreaterThanOrEqual(MIN_DIMENSION);
}

async function createCustomItem(page: Page, itemName: string, seed: number) {
    await page.goto('/inventory/create');
    await page.fill('#name', itemName);
    await page.fill('#description', 'Custom item with compressed image.');

    await uploadGeneratedImage(page, seed, 'noise');

    await page.click('button.submit-button');

    await expect
        .poll(async () => getCustomContentRecord(page, 'items', 'name', itemName), {
            timeout: 10_000,
        })
        .toBeTruthy();

    return (await getCustomContentRecord(page, 'items', 'name', itemName)) as {
        id?: string | number;
        image?: string;
    };
}

test.describe('Custom image compression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('compresses custom item uploads and preserves preview', async ({ page }) => {
        const itemName = `Compressed Item ${Date.now()}`;

        const savedItem = await createCustomItem(page, itemName, 123);
        expect(savedItem.image).toMatch(/^data:image\/jpeg;base64,/);

        const metrics = await getImageMetrics(page, savedItem.image as string);
        expectCompressedImage(metrics);
    });

    test('recompresses images when editing a custom item', async ({ page }) => {
        const itemName = `Compressed Item Edit ${Date.now()}`;
        const savedItem = await createCustomItem(page, itemName, 321);

        const itemId = savedItem.id;
        expect(itemId).toBeTruthy();

        await page.goto(`/inventory/item/${itemId}/edit`);

        await uploadGeneratedImage(page, 654, 'noise');
        await page.click('button.submit-button');

        await expect
            .poll(async () => getCustomContentRecord(page, 'items', 'name', itemName), {
                timeout: 10_000,
            })
            .toBeTruthy();

        const updatedItem = (await getCustomContentRecord(
            page,
            'items',
            'name',
            itemName
        )) as { image?: string };

        const updatedImage = updatedItem.image as string;
        expect(updatedImage).toMatch(/^data:image\/jpeg;base64,/);
        expect(updatedImage).not.toBe(savedItem.image);

        const updatedMetrics = await getImageMetrics(page, updatedImage);
        expectCompressedImage(updatedMetrics);
    });

    test('compresses custom quest uploads and updates on edit', async ({ page }) => {
        const questTitle = `Compressed Quest ${Date.now()}`;

        await page.goto('/quests/create');
        await page.fill('#title', questTitle);
        await page.fill('#description', 'Custom quest with compressed image.');

        await uploadGeneratedImage(page, 456, 'noise');

        await page.click('button.submit-button');

        await expect
            .poll(async () => getCustomContentRecord(page, 'quests', 'title', questTitle), {
                timeout: 10_000,
            })
            .toBeTruthy();

        const savedQuest = (await getCustomContentRecord(
            page,
            'quests',
            'title',
            questTitle
        )) as { id?: string | number; image?: string; questId?: string | number; questID?: string };
        expect(savedQuest.image).toMatch(/^data:image\/jpeg;base64,/);

        const initialMetrics = await getImageMetrics(page, savedQuest.image as string);
        expectCompressedImage(initialMetrics);

        const questId = savedQuest.id ?? savedQuest.questId ?? savedQuest.questID;
        expect(questId).toBeTruthy();

        await page.goto(`/quests/${questId}/edit`);

        await uploadGeneratedImage(page, 789, 'solid');
        await page.click('button.submit-button');

        await expect
            .poll(async () => getCustomContentRecord(page, 'quests', 'title', questTitle), {
                timeout: 10_000,
            })
            .toBeTruthy();

        const updatedQuest = (await getCustomContentRecord(
            page,
            'quests',
            'title',
            questTitle
        )) as { image?: string };
        const updatedImage = updatedQuest.image as string;
        expect(updatedImage).toMatch(/^data:image\/jpeg;base64,/);
        expect(updatedImage).not.toBe(savedQuest.image);

        const updatedMetrics = await getImageMetrics(page, updatedImage);
        expectCompressedImage(updatedMetrics);
    });
});
