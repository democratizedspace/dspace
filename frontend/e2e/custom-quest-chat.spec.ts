import { test, expect, type Page } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

type DialogueOption = {
    type: string;
    text: string;
    goto?: string;
};

type DialogueNode = {
    id: string;
    text: string;
    options: DialogueOption[];
};

type CustomQuestRecord = {
    id: string;
    title: string;
    description: string;
    image: string;
    npc: string;
    start: string;
    dialogue: DialogueNode[];
    rewards: Array<{ id: string; count: number }>;
    requiresQuests: string[];
    custom: boolean;
    entityType: 'quest';
    createdAt: string;
    updatedAt: string;
};

async function seedCustomQuest(page: Page, quest: CustomQuestRecord) {
    await page.evaluate(async (questRecord) => {
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open('CustomContent', 3);

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
                if (!db.objectStoreNames.contains('quests')) {
                    db.createObjectStore('quests', { keyPath: 'id' });
                }
            };

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('quests', 'readwrite');
                const store = tx.objectStore('quests');
                store.put(questRecord);

                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = () => {
                    db.close();
                    reject(tx.error);
                };
            };
        });
    }, quest);
}

test.describe('Custom quest chat rendering', () => {
    test('custom quest chat shows dialogue and advances options', async ({ page }) => {
        await purgeClientState(page);

        const questId = `custom-quest-${Date.now()}`;
        const now = new Date().toISOString();
        const quest: CustomQuestRecord = {
            id: questId,
            title: 'Automated Custom Quest',
            description: 'Custom quest seeded for chat rendering test.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Welcome to the custom quest.',
                    options: [{ type: 'goto', text: 'Proceed', goto: 'next' }],
                },
                {
                    id: 'next',
                    text: 'You made it to the second node.',
                    options: [{ type: 'finish', text: 'Finish quest' }],
                },
            ],
            rewards: [],
            requiresQuests: [],
            custom: true,
            entityType: 'quest',
            createdAt: now,
            updatedAt: now,
        };

        await page.goto('/quests/create');
        await waitForHydration(page);
        await seedCustomQuest(page, quest);

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);

        await expect(page.getByTestId('chat-panel')).toBeVisible();
        await expect(page.getByText('Welcome to the custom quest.')).toBeVisible();
        const optionButton = page.getByRole('button', { name: 'Proceed' });
        await expect(optionButton).toBeVisible();
        await optionButton.click();
        await expect(page.getByText('You made it to the second node.')).toBeVisible();
    });

    test('built-in quest chat remains available', async ({ page }) => {
        await purgeClientState(page);

        await page.goto('/quests/chemistry/safe-reaction');
        await waitForHydration(page);

        await expect(page.getByTestId('chat-panel')).toBeVisible();
        await expect(
            page.getByText(
                [
                    'Phoenix here. Up for a safe reaction that shows how green propellants',
                    'release energy?',
                ].join(' ')
            )
        ).toBeVisible();
    });
});
