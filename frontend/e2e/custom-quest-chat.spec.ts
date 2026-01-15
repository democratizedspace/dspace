import { expect, test } from '@playwright/test';
import { clearUserData, seedCustomQuest, waitForHydration } from './test-helpers';

test.describe('Custom quest chat rendering', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('custom quests render QuestChat and advance dialogue', async ({ page }) => {
        const questId = `custom-quest-${Date.now()}`;
        const quest = {
            id: questId,
            title: 'E2E Custom Quest',
            description: 'Ensures custom quests use QuestChat.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Hello from custom quest',
                    options: [
                        {
                            type: 'goto',
                            text: 'Continue to next',
                            goto: 'next',
                        },
                    ],
                },
                {
                    id: 'next',
                    text: 'Custom quest second node',
                    options: [
                        {
                            type: 'finish',
                            text: 'Finish quest',
                        },
                    ],
                },
            ],
        };

        await seedCustomQuest(page, quest);
        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);

        await expect(page.getByTestId('chat-panel')).toBeVisible();

        const npcDialogue = page.locator('.npcDialogue');
        await expect(npcDialogue).toContainText('Hello from custom quest');

        const optionButton = page.getByRole('button', { name: 'Continue to next' });
        await expect(optionButton).toBeVisible();
        await optionButton.click();

        await expect(npcDialogue).toContainText('Custom quest second node');
    });

    test('built-in quests still render QuestChat', async ({ page }) => {
        await page.goto('/quests/chemistry/safe-reaction');
        await waitForHydration(page);

        await expect(page.getByTestId('chat-panel')).toBeVisible();
    });
});
