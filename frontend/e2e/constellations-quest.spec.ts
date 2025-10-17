import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { resetClientStorage } from './utils/idb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questPath = path.resolve(__dirname, '../test-data/constellations-quest.json');
const questTemplate = JSON.parse(fs.readFileSync(questPath, 'utf8'));

const REGEX_SPECIAL_CHARACTERS = new RegExp(String.raw`[.*+?^${}()|[\]\\]`, 'g');

function escapeRegExp(input: string): string {
    return input.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}

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

const QUEST_DB_CONFIG = {
    dbName: CUSTOM_CONTENT_DB_NAME,
    dbVersion: CUSTOM_CONTENT_DB_VERSION,
    storeName: QUEST_STORE_NAME,
    auxStores: [
        { name: 'meta' },
        { name: 'items', options: { keyPath: 'id' as const } },
        { name: 'processes', options: { keyPath: 'id' as const } },
    ],
};

type QuestDbOperation =
    | { type: 'findByTitle'; title: string }
    | { type: 'get'; id: number }
    | { type: 'update'; id: number; questPatch: Record<string, unknown> };

const questDbEvaluator = async ({
    config,
    operation,
}: {
    config: typeof QUEST_DB_CONFIG;
    operation: QuestDbOperation;
}): Promise<unknown> => {
    const openDatabase = () =>
        new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(config.dbName, config.dbVersion);

            request.onupgradeneeded = () => {
                const db = request.result;
                const ensureStore = (name: string, options?: IDBObjectStoreParameters) => {
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, options);
                    }
                };

                for (const store of config.auxStores) {
                    ensureStore(store.name, store.options);
                }

                ensureStore(config.storeName, { keyPath: 'id' });
            };

            request.onerror = () =>
                reject(
                    request.error ??
                        new Error(`Failed to open IndexedDB database "${config.dbName}"`)
                );
            request.onsuccess = () => resolve(request.result);
        });

    const db = await openDatabase();

    try {
        if (operation.type === 'findByTitle') {
            return await new Promise<number>((resolve, reject) => {
                const transaction = db.transaction(config.storeName, 'readonly');
                transaction.onabort = () =>
                    reject(
                        transaction.error ??
                            new Error('Quest lookup transaction aborted unexpectedly')
                    );
                transaction.onerror = () =>
                    reject(
                        transaction.error ??
                            new Error('Quest lookup transaction failed unexpectedly')
                    );

                const store = transaction.objectStore(config.storeName);
                const request = store.getAll();
                request.onerror = () =>
                    reject(
                        request.error ?? new Error('Failed to read quests from IndexedDB store')
                    );
                request.onsuccess = () => {
                    const quests = Array.isArray(request.result) ? request.result : [];
                    const match = quests.find(
                        (quest: { title?: string | null; id?: unknown }) =>
                            quest?.title === operation.title
                    );

                    if (!match || typeof match !== 'object') {
                        resolve(-1);
                        return;
                    }

                    const questId = Number((match as { id?: unknown }).id);
                    resolve(Number.isFinite(questId) ? questId : -1);
                };
            });
        }

        if (operation.type === 'get') {
            return await new Promise<QuestRecord | null>((resolve, reject) => {
                const transaction = db.transaction(config.storeName, 'readonly');
                transaction.onabort = () =>
                    reject(
                        transaction.error ??
                            new Error('Quest read transaction aborted unexpectedly')
                    );
                transaction.onerror = () =>
                    reject(
                        transaction.error ??
                            new Error('Quest read transaction failed unexpectedly')
                    );

                const store = transaction.objectStore(config.storeName);
                const request = store.get(operation.id);
                request.onerror = () =>
                    reject(
                        request.error ??
                            new Error(`Failed to load quest ${operation.id} from IndexedDB`)
                    );
                request.onsuccess = () => {
                    resolve((request.result as QuestRecord | null | undefined) ?? null);
                };
            });
        }

        if (operation.type === 'update') {
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction(config.storeName, 'readwrite');
                transaction.oncomplete = () => resolve();
                transaction.onabort = () =>
                    reject(
                        transaction.error ??
                            new Error(
                                `Quest update transaction aborted for id ${operation.id}`
                            )
                    );
                transaction.onerror = () =>
                    reject(
                        transaction.error ??
                            new Error(`Quest update transaction failed for id ${operation.id}`)
                    );

                const store = transaction.objectStore(config.storeName);
                const getRequest = store.get(operation.id);

                getRequest.onerror = () =>
                    reject(
                        getRequest.error ??
                            new Error(`Failed to load quest ${operation.id} before update`)
                    );

                getRequest.onsuccess = () => {
                    const existingQuest = getRequest.result as QuestRecord | undefined;
                    if (!existingQuest) {
                        reject(new Error(`Quest not found with id ${operation.id}`));
                        return;
                    }

                    const updatedQuest = {
                        ...existingQuest,
                        ...(operation.questPatch ?? {}),
                        id: existingQuest.id,
                        type: existingQuest.type ?? 'quest',
                        createdAt: existingQuest.createdAt ?? new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } satisfies QuestRecord;

                    const putRequest = store.put(updatedQuest);
                    putRequest.onerror = () =>
                        reject(
                            putRequest.error ??
                                new Error(`Failed to persist quest ${operation.id} to IndexedDB`)
                        );
                };
            });

            return true;
        }

        throw new Error(
            `Unsupported quest DB operation: ${String((operation as { type?: unknown }).type)}`
        );
    } finally {
        db.close();
    }
};

async function runQuestDbOperation<T>(page: Page, operation: QuestDbOperation): Promise<T> {
    return page.evaluate(questDbEvaluator, {
        config: QUEST_DB_CONFIG,
        operation,
    }) as Promise<T>;
}

async function findQuestIdByTitle(page: Page, title: string): Promise<number> {
    return runQuestDbOperation<number>(page, { type: 'findByTitle', title });
}

async function updateQuestInIndexedDB(page: Page, id: number, questPatch: unknown): Promise<void> {
    await runQuestDbOperation<boolean>(page, {
        type: 'update',
        id,
        questPatch: (questPatch ?? {}) as Record<string, unknown>,
    });
}

async function getQuestFromIndexedDB<T>(page: Page, id: number): Promise<T | null> {
    return runQuestDbOperation<T | null>(page, { type: 'get', id });
}

async function waitForQuestIdByTitle(
    page: Page,
    title: string,
    timeout = 10_000
): Promise<number> {
    const questIdHandle = await page.waitForFunction(
        async ({ config, questTitle }) => {
            const openDatabase = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open(config.dbName, config.dbVersion);

                    request.onupgradeneeded = () => {
                        const db = request.result;
                        const ensureStore = (name: string, options?: IDBObjectStoreParameters) => {
                            if (!db.objectStoreNames.contains(name)) {
                                db.createObjectStore(name, options);
                            }
                        };

                        for (const store of config.auxStores) {
                            ensureStore(store.name, store.options);
                        }

                        ensureStore(config.storeName, { keyPath: 'id' });
                    };

                    request.onerror = () =>
                        reject(
                            request.error ??
                                new Error(`Failed to open IndexedDB database "${config.dbName}"`)
                        );
                    request.onsuccess = () => resolve(request.result);
                });

            let db: IDBDatabase | undefined;
            try {
                db = await openDatabase();
                return await new Promise<number | null>((resolve, reject) => {
                    const transaction = db!.transaction(config.storeName, 'readonly');
                    transaction.onabort = () =>
                        reject(
                            transaction.error ??
                                new Error('Quest lookup transaction aborted while waiting for quest')
                        );
                    transaction.onerror = () =>
                        reject(
                            transaction.error ??
                                new Error('Quest lookup transaction failed while waiting for quest')
                        );

                    const store = transaction.objectStore(config.storeName);
                    const request = store.getAll();
                    request.onerror = () =>
                        reject(
                            request.error ?? new Error('Failed to read quests while waiting for quest')
                        );
                    request.onsuccess = () => {
                        const quests = Array.isArray(request.result) ? request.result : [];
                        const match = quests.find(
                            (quest: { title?: string | null; id?: unknown }) =>
                                quest?.title === questTitle
                        );

                        if (!match || typeof match !== 'object') {
                            resolve(null);
                            return;
                        }

                        const questId = Number((match as { id?: unknown }).id);
                        resolve(Number.isFinite(questId) && questId > 0 ? questId : null);
                    };
                });
            } catch (error) {
                console.warn('Quest lookup failed while waiting for quest:', error);
                return null;
            } finally {
                if (db) {
                    db.close();
                }
            }
        },
        { config: QUEST_DB_CONFIG, questTitle: title },
        { timeout, polling: 200 }
    );

    const questId = await questIdHandle.jsonValue();
    if (typeof questId !== 'number' || questId <= 0) {
        throw new Error(`Quest "${title}" was not found in IndexedDB within ${timeout}ms.`);
    }

    return questId;
}

/**
 * End-to-end creation of the constellations quest using the in-game UI.
 * After creation, the quest JSON is patched with the full example and
 * validated with the quest simulation helper.
 */

test.describe('Constellations Quest Creation', () => {
    test.beforeEach(async ({ page }) => {
        await resetClientStorage(page);
    });

    test('create and validate constellations quest', async ({ page }) => {
        // Step 1: create the quest via the UI
        await page.goto('/quests/create');
        await expect(page).toHaveURL(/\/quests\/create$/);
        await expect(page.getByRole('heading', { level: 2, name: 'Create a New Quest' })).toBeVisible();

        const titleInput = page.getByLabel(/Title/i);
        await expect(titleInput).toBeVisible();
        await titleInput.fill(questTemplate.title);

        const descriptionInput = page.getByLabel(/Description/i);
        await expect(descriptionInput).toBeVisible();
        await descriptionInput.fill(questTemplate.description);

        const imageInput = page.getByLabel(/Upload an Image/i);
        if ((await imageInput.count()) > 0) {
            await imageInput.setInputFiles(path.resolve(__dirname, '../test-data/test-image.jpg'));
        }

        const submitButton = page.getByRole('button', { name: /Create Quest/i });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        const successMessage = page.getByRole('status', {
            name: /Quest created successfully/i,
        });
        await expect(successMessage).toBeVisible();

        // Step 2: find the created quest id in IndexedDB
        const questId = await waitForQuestIdByTitle(page, questTemplate.title);
        expect(questId).toBeGreaterThan(0);

        const viewQuestLink = successMessage.getByRole('link', { name: /View quest/i });
        await expect(viewQuestLink).toBeVisible();
        await expect(viewQuestLink).toHaveAttribute('href', new RegExp(`/quests/${questId}`));

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
        await expect(page).toHaveURL(/\/quests$/);
        const questTitlePattern = new RegExp(`^${escapeRegExp(questTemplate.title)}$`, 'i');
        await expect(page.getByRole('link', { name: questTitlePattern })).toBeVisible();
    });
});
