import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { purgeClientState } from './utils/idb';

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
const QUEST_WAIT_TIMEOUT_MS = 15_000;

async function waitForQuestIdByTitle(page: Page, title: string): Promise<number> {
    const questIdHandle = await page.waitForFunction(
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
                return await new Promise<number | undefined>((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    transaction.onerror = () =>
                        reject(
                            transaction.error ??
                                new Error('Quest lookup transaction failed during creation wait')
                        );

                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to retrieve quests by title'));
                    request.onsuccess = () => {
                        const quests = Array.isArray(request.result) ? request.result : [];
                        const match = quests.find(
                            (quest: { title?: string; id?: unknown }) => quest?.title === title
                        );
                        if (match) {
                            const rawId = (match as { id?: unknown }).id;
                            if (typeof rawId === 'number' && Number.isFinite(rawId)) {
                                resolve(rawId);
                                return;
                            }
                            if (typeof rawId === 'string' && rawId.trim().length > 0) {
                                const parsed = Number.parseInt(rawId, 10);
                                resolve(Number.isFinite(parsed) ? parsed : undefined);
                                return;
                            }
                        }
                        resolve(undefined);
                    };
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
        },
        { timeout: QUEST_WAIT_TIMEOUT_MS, polling: 250 }
    );

    const questId = await questIdHandle.jsonValue();
    if (typeof questId !== 'number' || questId <= 0) {
        throw new Error(`Quest titled "${title}" was not created within the expected time.`);
    }

    return questId;
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
                    transaction.onabort = () =>
                        reject(
                            transaction.error ??
                                new Error(`Quest update txn aborted for quest ${id}`)
                        );
                    transaction.onerror = () =>
                        reject(
                            transaction.error ??
                                new Error(`Quest update txn failed for quest ${id}`)
                        );
                    const store = transaction.objectStore(storeName);
                    const getRequest = store.get(id);

                    getRequest.onerror = () =>
                        reject(
                            getRequest.error ??
                                new Error(`Failed to load quest ${id} before patching`)
                        );
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
                            reject(
                                putRequest.error ??
                                    new Error(`Failed to persist quest ${id} changes`)
                            );
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
                    transaction.onabort = () =>
                        reject(
                            transaction.error ??
                                new Error(`Quest read txn aborted for quest ${id}`)
                        );
                    transaction.onerror = () =>
                        reject(
                            transaction.error ?? new Error(`Quest read txn failed for quest ${id}`)
                        );
                    const store = transaction.objectStore(storeName);
                    const request = store.get(id);

                    request.onsuccess = () => resolve(request.result ?? null);
                    request.onerror = () =>
                        reject(
                            request.error ?? new Error(`Failed to retrieve quest ${id} data`)
                        );
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
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await purgeClientState(page);
    });

    test('create and validate constellations quest', async ({ page }) => {
        // Step 1: create the quest via the UI
        await page.goto('/quests/create');
        await expect(page.getByTestId('quest-form')).toBeVisible();

        await expect(page.getByTestId('quest-title-input')).toBeVisible();
        await page.getByTestId('quest-title-input').fill(questTemplate.title);

        await expect(page.getByTestId('quest-description-input')).toBeVisible();
        await page.getByTestId('quest-description-input').fill(questTemplate.description);

        const imageInput = page.getByTestId('quest-image-input');
        if (await imageInput.isVisible()) {
            await imageInput.setInputFiles(path.resolve(__dirname, '../test-data/test-image.jpg'));
        }

        await expect(page.getByTestId('quest-submit-button')).toBeEnabled();
        await page.getByTestId('quest-submit-button').click();

        // Step 2: find the created quest id in IndexedDB
        const questId = await waitForQuestIdByTitle(page, questTemplate.title);

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
        await expect(page.getByText(questTemplate.title, { exact: true })).toBeVisible();
    });
});
