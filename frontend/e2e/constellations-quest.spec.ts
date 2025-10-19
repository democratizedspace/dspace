import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { waitForHydration } from './test-helpers';
import { purgeClientStorage } from './utils/idb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questPath = path.resolve(__dirname, '../test-data/constellations-quest.json');
const questTemplate = JSON.parse(fs.readFileSync(questPath, 'utf8'));

type QuestIdentifier = number | string;

type QuestRecord = {
    id: QuestIdentifier;
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

function generateUniqueQuestTitle(baseTitle: string): string {
    const suffix = randomUUID().slice(0, 8);
    return `${baseTitle} (${suffix})`;
}

function normalizeQuestIdentifiers(ids: QuestIdentifier[]): string[] {
    return [...ids.map((id) => String(id)).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))];
}

async function runQuestDatabaseOperation<T>(
    page: Page,
    operation: 'lookupByTitle' | 'listIdsByTitle' | 'getById' | 'updateById',
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
                            request.error ??
                                new Error(`Failed to open IndexedDB database "${dbName}"`)
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

                        return await new Promise<QuestIdentifier | null>((resolve, reject) => {
                            transaction.onabort = () =>
                                reject(
                                    transaction.error ??
                                        new Error(
                                            'Quest lookup transaction was aborted unexpectedly'
                                        )
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
                                    (quest: { title?: string | null; id?: unknown }) =>
                                        quest?.title === title
                                );
                                if (!match) {
                                    resolve(null);
                                    return;
                                }

                                const rawId = (match as Record<string, unknown>).id;
                                if (typeof rawId === 'string') {
                                    resolve(rawId);
                                    return;
                                }

                                if (typeof rawId === 'number' && Number.isFinite(rawId)) {
                                    resolve(rawId);
                                    return;
                                }

                                resolve(null);
                            };
                        });
                    });
                }
                case 'listIdsByTitle': {
                    const { title } = payload as { title: string };
                    return withTransaction('readonly', async (transaction) => {
                        const store = transaction.objectStore(storeName);
                        const request = store.getAll();

                        return await new Promise<QuestIdentifier[]>((resolve, reject) => {
                            transaction.onabort = () =>
                                reject(
                                    transaction.error ??
                                        new Error(
                                            'Quest lookup transaction was aborted unexpectedly'
                                        )
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

                                const ids = quests.reduce<QuestIdentifier[]>((acc, quest) => {
                                    const candidate = quest as { id?: unknown; title?: unknown };
                                    if (candidate?.title !== title) {
                                        return acc;
                                    }

                                    if (typeof candidate.id === 'string') {
                                        acc.push(candidate.id);
                                        return acc;
                                    }

                                    if (
                                        typeof candidate.id === 'number' &&
                                        Number.isFinite(candidate.id)
                                    ) {
                                        acc.push(candidate.id);
                                        return acc;
                                    }

                                    return acc;
                                }, []);

                                resolve(ids);
                            };
                        });
                    });
                }
                case 'getById': {
                    const { id } = payload as { id: QuestIdentifier };
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
                    const { id, questPatch } = payload as {
                        id: QuestIdentifier;
                        questPatch: Record<string, unknown>;
                    };
                    await withTransaction('readwrite', async (transaction) => {
                        const store = transaction.objectStore(storeName);
                        const getRequest = store.get(id);

                        await new Promise<void>((resolve, reject) => {
                            transaction.onabort = () =>
                                reject(
                                    transaction.error ??
                                        new Error(
                                            'Quest update transaction was aborted unexpectedly'
                                        )
                                );
                            transaction.onerror = () =>
                                reject(
                                    transaction.error ??
                                        new Error('Quest update transaction failed to complete')
                                );
                            transaction.oncomplete = () => resolve();

                            getRequest.onerror = () =>
                                reject(
                                    getRequest.error ??
                                        new Error('Failed to load quest from IndexedDB')
                                );
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
                                        putRequest.error ??
                                            new Error(
                                                'Failed to persist quest updates to IndexedDB'
                                            )
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

async function findQuestIdByTitle(page: Page, title: string): Promise<QuestIdentifier | null> {
    return runQuestDatabaseOperation<QuestIdentifier | null>(page, 'lookupByTitle', {
        title,
    });
}

async function findQuestIdsByTitle(page: Page, title: string): Promise<QuestIdentifier[]> {
    return runQuestDatabaseOperation<QuestIdentifier[]>(page, 'listIdsByTitle', {
        title,
    });
}

async function updateQuestInIndexedDB(
    page: Page,
    id: QuestIdentifier,
    questPatch: unknown
): Promise<void> {
    await runQuestDatabaseOperation<undefined>(page, 'updateById', {
        id,
        questPatch: questPatch as Record<string, unknown>,
    });
}

async function getQuestFromIndexedDB<T>(page: Page, id: QuestIdentifier): Promise<T | null> {
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
        const questTitle = generateUniqueQuestTitle(questTemplate.title);
        // Step 1: create the quest via the UI
        await page.goto('/quests/create');
        await expect(page).toHaveURL(/\/quests\/create/);

        const titleInput = page.locator('#title');
        await expect(titleInput).toBeVisible();
        await titleInput.fill(questTitle);

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
        let questId: QuestIdentifier | null = null;
        await expect
            .poll(
                async () => {
                    questId = await findQuestIdByTitle(page, questTitle);
                    return questId;
                },
                { timeout: 10_000, intervals: [500, 750, 1000] }
            )
            .not.toBeNull();

        expect(questId).not.toBeNull();

        // Step 3: patch quest with full JSON
        const questPatch = JSON.parse(JSON.stringify(questTemplate));
        questPatch.title = questTitle;
        await updateQuestInIndexedDB(page, questId as QuestIdentifier, questPatch);

        // Retrieve quest back from IndexedDB
        const storedQuest = await getQuestFromIndexedDB(page, questId as QuestIdentifier);

        // Validate with questHasFinishPath helper
        const { questHasFinishPath } = await import('../src/utils/simulateQuest.js');
        expect(questHasFinishPath(storedQuest)).toBe(true);

        // Verify it appears in quests list
        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const searchInput = page.getByPlaceholder('Search quests...');
        await searchInput.fill(questTitle);
        const questRow = page.getByTestId('quest-row').filter({ hasText: questTitle });
        await expect(questRow).toHaveCount(1);
    });

    test('prevents creating a quest with a duplicate title', async ({ page }) => {
        await page.goto('/quests/create');
        await expect(page).toHaveURL(/\/quests\/create/);

        const titleInput = page.locator('#title');
        await expect(titleInput).toBeVisible();
        await titleInput.fill(questTemplate.title);
        await titleInput.blur();

        const descriptionInput = page.locator('#description');
        await expect(descriptionInput).toBeVisible();
        await descriptionInput.fill(questTemplate.description);

        const imageInput = page.locator('input[type="file"]');
        if ((await imageInput.count()) > 0) {
            await imageInput.setInputFiles(path.resolve(__dirname, '../test-data/test-image.jpg'));
        }

        await expect(page.getByText('Title must be unique', { exact: false })).toBeVisible();

        let questIdsBeforeAttempt: string[] = [];

        await expect
            .poll(
                async () => {
                    questIdsBeforeAttempt = normalizeQuestIdentifiers(
                        await findQuestIdsByTitle(page, questTemplate.title)
                    );
                    return questIdsBeforeAttempt.length;
                },
                { timeout: 10_000, intervals: [500, 750, 1000] }
            )
            .toBeGreaterThan(0);

        const createButton = page.getByRole('button', { name: 'Create Quest' });
        await expect(createButton).toBeVisible();
        await createButton.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/quests\/create/);

        const questIdsAfterAttempt = normalizeQuestIdentifiers(
            await findQuestIdsByTitle(page, questTemplate.title)
        );
        expect(questIdsAfterAttempt).toEqual(questIdsBeforeAttempt);
    });
});
