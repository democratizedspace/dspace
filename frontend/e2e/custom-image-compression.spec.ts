import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearUserData } from './test-helpers';

const MAX_BYTES = 52 * 1024;
const MAX_DIMENSION = 512;
const MIN_DIMENSION = 256;

type GeneratedImageStyle = 'noise' | 'solid';
type GeneratedImageDimensions = { width: number; height: number };

async function generatePngDataUrl(
    page: Page,
    seed: number,
    style: GeneratedImageStyle,
    dimensions: GeneratedImageDimensions,
    markerSize = 48
) {
    return page.evaluate(
        async ({ seedValue, imageStyle, width, height, markerSize }) => {
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
            const hue = (seedValue * 37) % 360;
            ctx.fillStyle = `hsla(${hue}, 90%, 75%, 0.9)`;
            const maxX = Math.max(0, width - markerSize);
            const maxY = Math.max(0, height - markerSize);
            const markerX = maxX > 0 ? (seedValue * 3) % maxX : 0;
            const markerY = maxY > 0 ? (seedValue * 5) % maxY : 0;
            ctx.fillRect(markerX, markerY, markerSize, markerSize);

            return canvas.toDataURL('image/png');
        },
        {
            seedValue: seed,
            imageStyle: style,
            width: dimensions.width,
            height: dimensions.height,
            markerSize,
        }
    );
}

async function uploadGeneratedImage(
    page: Page,
    seed: number,
    style: GeneratedImageStyle,
    dimensions: GeneratedImageDimensions = { width: 1600, height: 1200 },
    markerSize?: number
) {
    const dataUrl = await generatePngDataUrl(page, seed, style, dimensions, markerSize);
    const base64Payload = dataUrl.split(',')[1] ?? '';
    const buffer = Buffer.from(base64Payload, 'base64');

    const preview = page.getByTestId('image-preview');
    const previousPreviewSrc =
        (await preview.count()) > 0 ? await preview.getAttribute('src') : null;

    let input = page.getByTestId('image-file-input');
    if ((await input.count()) === 0) {
        input = page.locator('input[type="file"]').first();
    }

    await input.setInputFiles({
        name: `${style}-${seed}.png`,
        mimeType: 'image/png',
        buffer,
    });

    await expect(preview).toBeVisible();
    await expect
        .poll(async () => {
            const src = await preview.getAttribute('src');
            if (!src) {
                return null;
            }
            if (previousPreviewSrc && src === previousPreviewSrc) {
                return null;
            }
            return src;
        })
        .toMatch(/^data:image\/jpeg;base64,/);

    await expect(input).toHaveAttribute('data-processing', 'false');
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

        await uploadGeneratedImage(page, 654, 'solid', { width: 1200, height: 1600 }, 240);
        await page.click('button.submit-button');

        let updatedImage: string | null = null;
        await expect
            .poll(
                async () => {
                    const record = (await getCustomContentRecord(
                        page,
                        'items',
                        'name',
                        itemName
                    )) as { image?: string } | null;
                    if (!record?.image || record.image === savedItem.image) {
                        return null;
                    }
                    updatedImage = record.image;
                    return updatedImage;
                },
                { timeout: 10_000 }
            )
            .not.toBeNull();

        if (!updatedImage) {
            throw new Error('Updated quest image was not found after edit.');
        }

        expect(updatedImage).toMatch(/^data:image\/jpeg;base64,/);

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

        const savedQuest = (await getCustomContentRecord(page, 'quests', 'title', questTitle)) as {
            id?: string | number;
            image?: string;
            questId?: string | number;
            questID?: string;
        };
        expect(savedQuest.image).toMatch(/^data:image\/jpeg;base64,/);

        const initialMetrics = await getImageMetrics(page, savedQuest.image as string);
        expectCompressedImage(initialMetrics);

        const questId = savedQuest.id ?? savedQuest.questId ?? savedQuest.questID;
        expect(questId).toBeTruthy();

        await page.goto(`/quests/${questId}/edit`);

        await uploadGeneratedImage(page, 789, 'solid', { width: 1400, height: 1000 }, 220);
        await page.click('button.submit-button');

        await expect
            .poll(async () => getCustomContentRecord(page, 'quests', 'title', questTitle), {
                timeout: 10_000,
            })
            .toBeTruthy();

        let updatedImage: string | null = null;
        await expect
            .poll(
                async () => {
                    const record = (await getCustomContentRecord(
                        page,
                        'quests',
                        'title',
                        questTitle
                    )) as { image?: string } | null;
                    if (!record?.image || record.image === savedQuest.image) {
                        return null;
                    }
                    updatedImage = record.image;
                    return updatedImage;
                },
                { timeout: 10_000 }
            )
            .not.toBeNull();

        if (!updatedImage) {
            throw new Error('Updated quest image was not found after edit.');
        }

        expect(updatedImage).toMatch(/^data:image\/jpeg;base64,/);

        const updatedMetrics = await getImageMetrics(page, updatedImage);
        expectCompressedImage(updatedMetrics);
    });
});
