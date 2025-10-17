import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { resetClientState } from './utils/idb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questPath = path.resolve(__dirname, '../test-data/constellations-quest.json');
const questTemplate = JSON.parse(fs.readFileSync(questPath, 'utf8'));
const questImagePath = path.resolve(__dirname, '../test-data/test-image.jpg');

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
};

function createQuestPatch(): QuestRecord {
    return JSON.parse(JSON.stringify(questTemplate));
}

async function waitForQuestIdByTitle(page: Page, title: string): Promise<number> {
    const questIdHandle = await page.waitForFunction(
        async ({ title, config }) => {
            const { dbName, dbVersion, storeName } = config;
            const describeError = (step: string, error: unknown) => {
                const message =
                    error && typeof error === 'object' && 'message' in error
                        ? (error as { message?: string }).message ?? 'Unknown error'
                        : String(error ?? 'Unknown error');
                return `${step} failed for IndexedDB "${dbName}" store "${storeName}": ${message}`;
            };

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

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(new Error(describeError('Opening database', request.error)));
                });

            let db: IDBDatabase | undefined;

            try {
                db = await openDatabase();

                return await new Promise<number | null>((resolve) => {
                    let settled = false;
                    let questId: number | null = null;

                    const resolveOnce = (value: number | null) => {
                        if (!settled) {
                            settled = true;
                            resolve(value);
                        }
                    };

                    const warnAndContinue = (step: string, error: unknown) => {
                        console.warn(describeError(step, error));
                        resolveOnce(null);
                    };

                    const transaction = db!.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    request.onsuccess = () => {
                        const quests = Array.isArray(request.result) ? request.result : [];
                        const match = quests.find((quest: { title?: string | null }) => quest?.title === title);
                        if (match && typeof (match as { id?: unknown }).id !== 'undefined') {
                            const numericId = Number((match as { id?: unknown }).id);
                            questId = Number.isFinite(numericId) ? numericId : null;
                        }
                    };

                    request.onerror = () => warnAndContinue('Quest lookup', request.error);
                    transaction.onabort = () => warnAndContinue('Quest lookup transaction aborted', transaction.error);
                    transaction.onerror = () => warnAndContinue('Quest lookup transaction failed', transaction.error);
                    transaction.oncomplete = () => {
                        resolveOnce(questId && questId > 0 ? questId : null);
                    };
                });
            } catch (error) {
                console.warn(describeError('Quest lookup open error', error));
                return null;
            } finally {
                try {
                    db?.close();
                } catch (error) {
                    console.warn(describeError('Closing database connection', error));
                }
            }
        },
        { title, config: QUEST_DB_CONFIG },
        { timeout: 15_000, polling: 250 }
    );

    const questId = await questIdHandle.jsonValue();

    if (typeof questId !== 'number' || questId <= 0) {
        throw new Error(`Quest "${title}" was not found in IndexedDB within the expected time.`);
    }

    return questId;
}

async function updateQuestInIndexedDB(page: Page, id: number, questPatch: unknown): Promise<void> {
    await page.evaluate(
        async ({ id, questPatch, config }) => {
            const { dbName, dbVersion, storeName } = config;
            const describeError = (step: string, error: unknown) => {
                const message =
                    error && typeof error === 'object' && 'message' in error
                        ? (error as { message?: string }).message ?? 'Unknown error'
                        : String(error ?? 'Unknown error');
                return `${step} failed for IndexedDB "${dbName}" store "${storeName}": ${message}`;
            };

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

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(new Error(describeError('Opening database', request.error)));
                });

            const db = await openDatabase();

            try {
                await new Promise<void>((resolve, reject) => {
                    let settled = false;
                    const resolveOnce = () => {
                        if (!settled) {
                            settled = true;
                            resolve();
                        }
                    };
                    const rejectOnce = (step: string, error: unknown) => {
                        if (!settled) {
                            settled = true;
                            reject(new Error(describeError(step, error)));
                        }
                    };

                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);

                    transaction.oncomplete = resolveOnce;
                    transaction.onabort = () =>
                        rejectOnce('Quest update transaction aborted', transaction.error ?? new Error('Unknown error'));
                    transaction.onerror = () =>
                        rejectOnce('Quest update transaction failed', transaction.error ?? new Error('Unknown error'));

                    const getRequest = store.get(id);
                    getRequest.onerror = () =>
                        rejectOnce('Quest lookup before update', getRequest.error ?? new Error('Unknown error'));
                    getRequest.onsuccess = () => {
                        const existingQuest = getRequest.result as QuestRecord | undefined;
                        if (!existingQuest) {
                            rejectOnce('Quest lookup before update', new Error(`Quest ${id} not found`));
                            return;
                        }

                        const updatedQuest: QuestRecord = {
                            ...existingQuest,
                            ...(questPatch as Record<string, unknown>),
                            id: existingQuest.id,
                            type: existingQuest.type ?? 'quest',
                            createdAt: existingQuest.createdAt ?? new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };

                        const putRequest = store.put(updatedQuest);
                        putRequest.onerror = () =>
                            rejectOnce('Persist updated quest', putRequest.error ?? new Error('Unknown error'));
                    };
                });
            } finally {
                db.close();
            }
        },
        { id, questPatch, config: QUEST_DB_CONFIG }
    );
}

async function getQuestFromIndexedDB<T>(page: Page, id: number): Promise<T | null> {
    return page.evaluate(
        async ({ id, config }) => {
            const { dbName, dbVersion, storeName } = config;
            const describeError = (step: string, error: unknown) => {
                const message =
                    error && typeof error === 'object' && 'message' in error
                        ? (error as { message?: string }).message ?? 'Unknown error'
                        : String(error ?? 'Unknown error');
                return `${step} failed for IndexedDB "${dbName}" store "${storeName}": ${message}`;
            };

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

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(new Error(describeError('Opening database', request.error)));
                });

            const db = await openDatabase();

            try {
                return await new Promise<T | null>((resolve, reject) => {
                    let settled = false;
                    let questResult: T | null = null;

                    const resolveOnce = () => {
                        if (!settled) {
                            settled = true;
                            resolve(questResult);
                        }
                    };
                    const rejectOnce = (step: string, error: unknown) => {
                        if (!settled) {
                            settled = true;
                            reject(new Error(describeError(step, error)));
                        }
                    };

                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);

                    transaction.oncomplete = resolveOnce;
                    transaction.onabort = () =>
                        rejectOnce('Quest read transaction aborted', transaction.error ?? new Error('Unknown error'));
                    transaction.onerror = () =>
                        rejectOnce('Quest read transaction failed', transaction.error ?? new Error('Unknown error'));

                    const request = store.get(id);
                    request.onerror = () => rejectOnce('Quest read', request.error ?? new Error('Unknown error'));
                    request.onsuccess = () => {
                        questResult = (request.result ?? null) as T | null;
                    };
                });
            } finally {
                db.close();
            }
        },
        { id, config: QUEST_DB_CONFIG }
    );
}

/**
 * End-to-end creation of the constellations quest using the in-game UI.
 * After creation, the quest JSON is patched with the full example and
 * validated with the quest simulation helper.
 */

test.describe('Constellations Quest Creation', () => {
    test.beforeEach(async ({ page }) => {
        await resetClientState(page);
    });

    test('create and validate constellations quest', async ({ page }) => {
        await page.goto('/quests/create');
        await expect(page.getByRole('heading', { name: 'Create a New Quest' })).toBeVisible();

        await page.getByLabel('Title*').fill(questTemplate.title);
        await page.getByLabel('Description*').fill(questTemplate.description);
        await page.getByLabel('NPC Identifier*').fill(questTemplate.npc ?? '');

        const imageInput = page.getByLabel('Upload an Image*');
        await expect(imageInput).toBeVisible();
        await imageInput.setInputFiles(questImagePath);
        await expect(page.getByAltText('Quest preview')).toBeVisible();

        const submitButton = page.getByRole('button', { name: 'Create Quest' });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        const successMessage = page.getByRole('status');
        await expect(successMessage).toBeVisible();
        await expect(successMessage).toContainText('Quest created successfully');
        await expect(successMessage.getByRole('link', { name: 'View quest' })).toBeVisible();

        const questId = await waitForQuestIdByTitle(page, questTemplate.title);

        const questPatch = createQuestPatch();
        await updateQuestInIndexedDB(page, questId, questPatch);

        const storedQuest = await getQuestFromIndexedDB<QuestRecord>(page, questId);
        expect(storedQuest).not.toBeNull();

        const { questHasFinishPath } = await import('../src/utils/simulateQuest.js');
        expect(questHasFinishPath(storedQuest)).toBe(true);

        await page.goto('/quests');
        await expect(page).toHaveURL(/\/quests$/);
        await expect(page.getByRole('link', { name: questTemplate.title })).toBeVisible();
    });
});
