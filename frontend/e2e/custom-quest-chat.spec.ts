import { expect, test, Page } from '@playwright/test';
import { purgeClientStorage } from './utils/idb';
import { waitForHydration } from './test-helpers';

type QuestRecord = Record<string, unknown>;

type QuestDbParams = {
    dbName: string;
    dbVersion: number;
    storeName: string;
};

const QUEST_DB_PARAMS: QuestDbParams = {
    dbName: 'CustomContent',
    dbVersion: 3,
    storeName: 'quests',
};

async function seedCustomQuest(page: Page, quest: QuestRecord): Promise<void> {
    await page.evaluate(
        async ({ quest, params }) => {
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

            const db = await openDatabase();
            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readwrite');
                    tx.oncomplete = () => resolve();
                    tx.onerror = () =>
                        reject(tx.error ?? new Error('Quest write transaction failed'));
                    tx.objectStore(storeName).put(quest);
                });
            } finally {
                db.close();
            }
        },
        { quest, params: QUEST_DB_PARAMS }
    );
}

test.describe('Custom quest chat rendering', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientStorage(page);
    });

    test('custom quests render QuestChat and navigate dialogue', async ({ page }) => {
        const questId = `custom-quest-${Date.now()}`;
        const quest = {
            id: questId,
            title: 'Custom Quest Chat',
            description: 'Custom quest should render the QuestChat UI.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Custom quest start.',
                    options: [
                        {
                            type: 'goto',
                            goto: 'next',
                            text: 'Proceed',
                        },
                    ],
                },
                {
                    id: 'next',
                    text: 'Custom quest next step.',
                    options: [
                        {
                            type: 'goto',
                            goto: 'start',
                            text: 'Go back',
                        },
                    ],
                },
            ],
            rewards: [],
            requiresQuests: [],
            custom: true,
            entityType: 'quest',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await page.goto('/');
        await seedCustomQuest(page, quest);

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);

        await expect(page.getByTestId('chat-panel')).toBeVisible();
        await expect(page.getByText('Custom quest start.')).toBeVisible();
        const optionButton = page.getByRole('button', { name: 'Proceed' });
        await expect(optionButton).toBeVisible();

        await optionButton.click();
        await expect(page.getByText('Custom quest next step.')).toBeVisible();
    });

    test('built-in quests still render QuestChat', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await waitForHydration(page);
        await expect(page.getByTestId('chat-panel')).toBeVisible();
    });
});
