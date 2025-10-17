import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { clearUserData } from './test-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questPath = path.resolve(__dirname, '../test-data/constellations-quest.json');
const questTemplate = JSON.parse(fs.readFileSync(questPath, 'utf8'));

type QuestRecord = {
    id: number;
    title?: string | null;
    type?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
} & Record<string, unknown>;

const CUSTOM_CONTENT_DB_NAME = 'CustomContent';
const CUSTOM_CONTENT_DB_VERSION = 3;
const QUEST_STORE_NAME = 'quests';

async function findQuestIdByTitle(page: Page, title: string): Promise<number> {
    return page.evaluate(
        async ({ title, dbName, dbVersion, storeName }) => {
            const openDB = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open(dbName, dbVersion);

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
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { keyPath: 'id' });
                        }
                    };

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to open IndexedDB'));
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDB();
            try {
                return await new Promise<number>((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    request.onsuccess = () => {
                        const quests = Array.isArray(request.result)
                            ? (request.result as QuestRecord[])
                            : [];
                        const match = quests.find((quest) => quest?.title === title);
                        resolve(match ? Number(match.id) : -1);
                    };

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to list quests'));
                });
            } finally {
                db.close();
            }
        },
        {
            title,
            dbName: CUSTOM_CONTENT_DB_NAME,
            dbVersion: CUSTOM_CONTENT_DB_VERSION,
            storeName: QUEST_STORE_NAME,
        }
    );
}

async function updateQuestInIndexedDB(page: Page, id: number, questPatch: unknown): Promise<void> {
    await page.evaluate(
        async ({
            id,
            questPatch,
            dbName,
            dbVersion,
            storeName,
        }: {
            id: number;
            questPatch: unknown;
            dbName: string;
            dbVersion: number;
            storeName: string;
        }) => {
            const openDB = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open(dbName, dbVersion);

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
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { keyPath: 'id' });
                        }
                    };

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to open IndexedDB'));
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDB();
            try {
                await new Promise<void>((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const getRequest = store.get(id);

                    getRequest.onerror = () =>
                        reject(getRequest.error ?? new Error('Failed to load quest'));
                    getRequest.onsuccess = () => {
                        const existingQuest = getRequest.result as QuestRecord | undefined;
                        if (!existingQuest) {
                            reject(new Error(`Quest not found with id ${id}`));
                            return;
                        }

                        const updatedQuest: QuestRecord = {
                            ...existingQuest,
                            ...(questPatch as Record<string, unknown>),
                            id: existingQuest.id,
                            type: existingQuest.type ?? 'quest',
                            createdAt: existingQuest.createdAt,
                            updatedAt: new Date().toISOString(),
                        };

                        const putRequest = store.put(updatedQuest);
                        putRequest.onerror = () =>
                            reject(putRequest.error ?? new Error('Failed to update quest'));
                        putRequest.onsuccess = () => resolve();
                    };
                });
            } finally {
                db.close();
            }
        },
        {
            id,
            questPatch,
            dbName: CUSTOM_CONTENT_DB_NAME,
            dbVersion: CUSTOM_CONTENT_DB_VERSION,
            storeName: QUEST_STORE_NAME,
        }
    );
}

async function getQuestFromIndexedDB<T>(page: Page, id: number): Promise<T | null> {
    return page.evaluate(
        async ({ id, dbName, dbVersion, storeName }) => {
            const openDB = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open(dbName, dbVersion);

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
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { keyPath: 'id' });
                        }
                    };

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to open IndexedDB'));
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDB();
            try {
                return await new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(id);

                    request.onsuccess = () => resolve(request.result ?? null);
                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to load quest'));
                });
            } finally {
                db.close();
            }
        },
        {
            id,
            dbName: CUSTOM_CONTENT_DB_NAME,
            dbVersion: CUSTOM_CONTENT_DB_VERSION,
            storeName: QUEST_STORE_NAME,
        }
    );
}

/**
 * End-to-end creation of the constellations quest using the in-game UI.
 * After creation, the quest JSON is patched with the full example and
 * validated with the quest simulation helper.
 */

test.describe('Constellations Quest Creation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('create and validate constellations quest', async ({ page }) => {
        // Step 1: create the quest via the UI
        await page.goto('/quests/create');
        await page.waitForLoadState('networkidle');

        await page.fill('#title', questTemplate.title);
        await page.fill('#description', questTemplate.description);

        const imageInput = page.locator('input[type="file"]');
        if ((await imageInput.count()) > 0) {
            await imageInput.setInputFiles(path.resolve(__dirname, '../test-data/test-image.jpg'));
        }

        await page.click('button.submit-button');
        await page.waitForLoadState('networkidle');

        // Step 2: find the created quest id in IndexedDB
        const questId = await findQuestIdByTitle(page, questTemplate.title);

        expect(questId).toBeGreaterThan(0);

        // Step 3: patch quest with full JSON
        const questPatch = JSON.parse(JSON.stringify(questTemplate));
        await updateQuestInIndexedDB(page, questId, questPatch);

        // Retrieve quest back from IndexedDB
        const storedQuest = await getQuestFromIndexedDB(page, questId);

        // Validate with questHasFinishPath helper
        const { questHasFinishPath } = await import('../src/utils/simulateQuest.js');
        expect(questHasFinishPath(storedQuest)).toBe(true);

        // Verify it appears in quests list
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text="${questTemplate.title}"`)).toBeVisible();
    });
});
