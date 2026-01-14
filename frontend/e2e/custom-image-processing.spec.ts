import { test, expect, Page } from '@playwright/test';
import { clearUserData } from './test-helpers';

const MAX_IMAGE_BYTES = 52 * 1024;

type CustomContentEntity = {
    id: string | number;
    name?: string;
    title?: string;
    image?: string;
};

async function uploadNoisyImage(page: Page, selector: string, seed: number) {
    await page.waitForSelector(selector);
    await page.evaluate(
        async ({ selector, seed }) => {
            const input = document.querySelector(selector);
            if (!input || !(input instanceof HTMLInputElement)) {
                throw new Error(`Missing file input: ${selector}`);
            }

            const canvas = document.createElement('canvas');
            canvas.width = 2500;
            canvas.height = 1800;
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Canvas context unavailable');
            }

            const imageData = context.createImageData(canvas.width, canvas.height);
            let value = seed >>> 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
                value = (value * 1664525 + 1013904223) >>> 0;
                const channel = value & 0xff;
                imageData.data[i] = channel;
                imageData.data[i + 1] = (channel * 3) & 0xff;
                imageData.data[i + 2] = (channel * 7) & 0xff;
                imageData.data[i + 3] = 255;
            }
            context.putImageData(imageData, 0, 0);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });
            if (!blob) {
                throw new Error('Failed to create image blob');
            }

            const file = new File([blob], `noise-${seed}.png`, { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        },
        { selector, seed }
    );
}

async function getEntityByField(
    page: Page,
    storeName: 'items' | 'quests',
    field: 'name' | 'title',
    value: string
): Promise<CustomContentEntity | null> {
    return page.evaluate(
        async ({ storeName, field, value }) => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('CustomContent');
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const getAll = store.getAll();
                    getAll.onerror = () => reject(getAll.error);
                    getAll.onsuccess = () => {
                        const record =
                            getAll.result.find((item) => item?.[field] === value) ?? null;
                        db.close();
                        resolve(record);
                    };
                };
            });
        },
        { storeName, field, value }
    );
}

async function getEntityById(
    page: Page,
    storeName: 'items' | 'quests',
    id: string | number
): Promise<CustomContentEntity | null> {
    return page.evaluate(
        async ({ storeName, id }) => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('CustomContent');
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const getRequest = store.get(id);
                    getRequest.onerror = () => reject(getRequest.error);
                    getRequest.onsuccess = () => {
                        db.close();
                        resolve(getRequest.result ?? null);
                    };
                };
            });
        },
        { storeName, id }
    );
}

async function getImageMetrics(page: Page, dataUrl: string) {
    return page.evaluate(async (value) => {
        const [header, base64Data] = value.split(',');
        const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
        const bytes = Math.floor((base64Data.length * 3) / 4 - padding);
        const blob = await (await fetch(value)).blob();
        const bitmap = await createImageBitmap(blob);
        const width = bitmap.width;
        const height = bitmap.height;
        if (typeof bitmap.close === 'function') {
            bitmap.close();
        }
        return { bytes, width, height, header };
    }, dataUrl);
}

async function createCustomItem(page: Page, name: string, seed: number) {
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', name);
    await page.fill('#description', 'Test item for image processing');
    await uploadNoisyImage(page, '#image', seed);
    await page.click('button.submit-button');
    await page.waitForSelector('.submit-message.success', { timeout: 15000 });

    await expect
        .poll(() => getEntityByField(page, 'items', 'name', name), { timeout: 10000 })
        .not.toBeNull();

    return await getEntityByField(page, 'items', 'name', name);
}

async function createCustomQuest(page: Page, title: string, seed: number) {
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');
    await page.fill('#title', title);
    await page.fill('#description', 'Test quest for image processing');
    await uploadNoisyImage(page, '#image', seed);
    await page.click('button.submit-button');
    await page.waitForSelector('.success-message', { timeout: 15000 });

    await expect
        .poll(() => getEntityByField(page, 'quests', 'title', title), { timeout: 10000 })
        .not.toBeNull();

    return await getEntityByField(page, 'quests', 'title', title);
}

test.describe('Custom image processing', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('downsamples custom item and quest uploads on create', async ({ page }) => {
        const itemName = `Item Image ${Date.now()}`;
        const questTitle = `Quest Image ${Date.now()}`;

        const item = await createCustomItem(page, itemName, 1234);
        if (!item?.image) {
            throw new Error('Custom item image was not saved.');
        }
        expect(item.image.startsWith('data:image/jpeg')).toBe(true);

        const itemMetrics = await getImageMetrics(page, item.image);
        expect(itemMetrics.width).toBe(512);
        expect(itemMetrics.height).toBe(512);
        expect(itemMetrics.bytes).toBeLessThanOrEqual(MAX_IMAGE_BYTES);

        const quest = await createCustomQuest(page, questTitle, 5678);
        if (!quest?.image) {
            throw new Error('Custom quest image was not saved.');
        }
        expect(quest.image.startsWith('data:image/jpeg')).toBe(true);

        const questMetrics = await getImageMetrics(page, quest.image);
        expect(questMetrics.width).toBe(512);
        expect(questMetrics.height).toBe(512);
        expect(questMetrics.bytes).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    });

    test('downsamples custom item and quest uploads on edit', async ({ page }) => {
        const itemName = `Item Edit Image ${Date.now()}`;
        const questTitle = `Quest Edit Image ${Date.now()}`;

        const item = await createCustomItem(page, itemName, 1111);
        if (!item?.id || !item.image) {
            throw new Error('Custom item was not created.');
        }
        const originalItemImage = item.image;

        await page.goto(`/inventory/item/${item.id}/edit`);
        await page.waitForLoadState('networkidle');
        await uploadNoisyImage(page, '#image', 2222);
        await page.click('button.submit-button');
        await page.waitForSelector('.submit-message.success', { timeout: 15000 });

        await expect
            .poll(() => getEntityById(page, 'items', item.id), { timeout: 10000 })
            .not.toBeNull();
        const refreshedItem = await getEntityById(page, 'items', item.id);
        if (!refreshedItem?.image) {
            throw new Error('Updated item image was not saved.');
        }
        expect(refreshedItem.image).not.toBe(originalItemImage);

        const updatedItemMetrics = await getImageMetrics(page, refreshedItem.image);
        expect(updatedItemMetrics.width).toBe(512);
        expect(updatedItemMetrics.height).toBe(512);
        expect(updatedItemMetrics.bytes).toBeLessThanOrEqual(MAX_IMAGE_BYTES);

        const quest = await createCustomQuest(page, questTitle, 3333);
        if (!quest?.id || !quest.image) {
            throw new Error('Custom quest was not created.');
        }
        const originalQuestImage = quest.image;

        await page.goto(`/quests/${quest.id}/edit`);
        await page.waitForLoadState('networkidle');
        await uploadNoisyImage(page, '#image', 4444);
        await page.click('button.submit-button');
        await page.waitForSelector('.success-message', { timeout: 15000 });

        await expect
            .poll(() => getEntityById(page, 'quests', quest.id), { timeout: 10000 })
            .toBeTruthy();
        const refreshedQuest = await getEntityById(page, 'quests', quest.id);
        if (!refreshedQuest?.image) {
            throw new Error('Updated quest image was not saved.');
        }
        expect(refreshedQuest.image).not.toBe(originalQuestImage);

        const updatedQuestMetrics = await getImageMetrics(page, refreshedQuest.image);
        expect(updatedQuestMetrics.width).toBe(512);
        expect(updatedQuestMetrics.height).toBe(512);
        expect(updatedQuestMetrics.bytes).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    });
});
