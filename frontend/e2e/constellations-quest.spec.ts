import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { purgeClientStorage } from './utils/idb';

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

type QuestDbParams = {
    dbName: string;
    dbVersion: number;
    storeName: string;
};

const QUEST_DB_PARAMS: QuestDbParams = {
    dbName: CUSTOM_CONTENT_DB_NAME,
    dbVersion: CUSTOM_CONTENT_DB_VERSION,
    storeName: QUEST_STORE_NAME,
};

async function runQuestDatabaseOperation<T>(
    page: Page,
    operation: 'lookupByTitle' | 'getById' | 'updateById',
    payload: Record<string, unknown>
): Promise<T> {
    return page.evaluate(
        async ({ operation, payload, params }) => {
            const { dbName, dbVersion, storeName } = params as QuestDbParams;

            const openDatabase = () =>
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

                    request.onblocked = () =>
                        reject(new Error(`Opening IndexedDB "${dbName}" was blocked`));
                    request.onerror = () =>
                        reject(
                            request.error ?? new Error(`Failed to open IndexedDB database "${dbName}"`)
                        );
                    request.onsuccess = () => resolve(request.result);
                });

            const withTransaction = async <Result>(
                mode: IDBTransactionMode,
                handler: (transaction: IDBTransaction) => Promise<Result>
            ): Promise<Result> => {
                const db = await openDatabase();
                try {
                    return await handler(db.transaction(storeName, mode));
                } finally {
                    db.close();
                }
            };

            switch (operation) {
                case 'lookupByTitle': {
                    const { title } = payload as { title: string };
                    return withTransaction('readonly', async (transaction) => {
                        const store = transaction.objectStore(storeName);
                        const request = store.getAll();

                        return await new Promise<number>((resolve, reject) => {
                            transaction.onabort = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest lookup transaction was aborted unexpectedly')
                                );
                            transaction.onerror = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest lookup transaction failed to complete')
                                );
                            request.onerror = () =>
                                reject(
                                    request.error ??
                                        new Error('Failed to load quests from IndexedDB store')
                                );
                            request.onsuccess = () => {
                                const quests = Array.isArray(request.result) ? request.result : [];
                                const match = quests.find(
                                    (quest: { title?: string | null; id?: unknown }) => quest?.title === title
                                );
                                resolve(
                                    match && typeof (match as Record<string, unknown>).id !== 'undefined'
                                        ? Number((match as Record<string, unknown>).id)
                                        : -1
                                );
                            };
                        });
                    });
                }
                case 'getById': {
                    const { id } = payload as { id: number };
                    return withTransaction('readonly', async (transaction) => {
                        const store = transaction.objectStore(storeName);
                        const request = store.get(id);

                        return await new Promise<unknown>((resolve, reject) => {
                            transaction.onabort = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest read transaction was aborted unexpectedly')
                                );
                            transaction.onerror = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest read transaction failed to complete')
                                );
                            request.onerror = () =>
                                reject(
                                    request.error ??
                                        new Error('Failed to read quest from IndexedDB store')
                                );
                            request.onsuccess = () => resolve(request.result ?? null);
                        });
                    });
                }
                case 'updateById': {
                    const { id, questPatch } = payload as { id: number; questPatch: Record<string, unknown> };
                    await withTransaction('readwrite', async (transaction) => {
                        const store = transaction.objectStore(storeName);
                        const getRequest = store.get(id);

                        await new Promise<void>((resolve, reject) => {
                            transaction.onabort = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest update transaction was aborted unexpectedly')
                                );
                            transaction.onerror = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest update transaction failed to complete')
                                );
                            transaction.oncomplete = () => resolve();

                            getRequest.onerror = () =>
                                reject(getRequest.error ?? new Error('Failed to load quest from IndexedDB'));
                            getRequest.onsuccess = () => {
                                const existingQuest = getRequest.result as QuestRecord | undefined;

                                if (!existingQuest) {
                                    reject(new Error(`Quest not found with id ${id}`));
                                    return;
                                }

                                const updatedQuest: QuestRecord = {
                                    ...existingQuest,
                                    ...questPatch,
                                    id: existingQuest.id,
                                    type: existingQuest.type ?? 'quest',
                                    createdAt: existingQuest.createdAt,
                                    updatedAt: new Date().toISOString(),
                                };

                                const putRequest = store.put(updatedQuest);
                                putRequest.onerror = () =>
                                    reject(
                                        putRequest.error ?? new Error('Failed to persist quest updates to IndexedDB')
                                    );
                            };
                        });
                    });
                    return undefined as unknown as T;
                }
                default:
                    throw new Error(`Unsupported quest database operation: ${String(operation)}`);
            }
        },
        {
            operation,
            payload,
            params: QUEST_DB_PARAMS,
        }
    );
}

async function findQuestIdByTitle(page: Page, title: string): Promise<number> {
    return runQuestDatabaseOperation<number>(page, 'lookupByTitle', { title });
}

async function updateQuestInIndexedDB(page: Page, id: number, questPatch: unknown): Promise<void> {
    await runQuestDatabaseOperation<undefined>(page, 'updateById', {
        id,
        questPatch: questPatch as Record<string, unknown>,
    });
}

async function getQuestFromIndexedDB<T>(page: Page, id: number): Promise<T | null> {
    return runQuestDatabaseOperation<T | null>(page, 'getById', { id });
}

/**
 * End-to-end creation of the constellations quest using the in-game UI.
 * After creation, the quest JSON is patched with the full example and
 * validated with the quest simulation helper.
 */

test.describe('Constellations Quest Creation', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientStorage(page);
    });

    test('create and validate constellations quest', async ({ page }) => {
        // Step 1: create the quest via the UI
        await page.goto('/quests/create');
        await expect(page).toHaveURL(/\/quests\/create/);

        const titleInput = page.locator('#title');
        await expect(titleInput).toBeVisible();
        await titleInput.fill(questTemplate.title);

        const descriptionInput = page.locator('#description');
        await expect(descriptionInput).toBeVisible();
        await descriptionInput.fill(questTemplate.description);

        const createButton = page.getByRole('button', { name: 'Create Quest' });
        await expect(createButton).toBeVisible();

        const imageInput = page.locator('input[type="file"]');
        if ((await imageInput.count()) > 0) {
            await imageInput.setInputFiles(path.resolve(__dirname, '../test-data/test-image.jpg'));
        }

        await createButton.click();
        await page.waitForLoadState('networkidle');

        // Step 2: find the created quest id in IndexedDB with a short poll
        let questId = -1;
        await expect
            .poll(async () => {
                questId = await findQuestIdByTitle(page, questTemplate.title);
                return questId;
            }, { timeout: 10_000, intervals: [500, 750, 1000] })
            .toBeGreaterThan(0);

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
        await expect(page.getByRole('link', { name: questTemplate.title })).toBeVisible();
    });
});
