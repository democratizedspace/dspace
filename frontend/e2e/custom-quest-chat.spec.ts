import { test, expect } from '@playwright/test';
import { clearUserData, seedCustomQuest, waitForHydration } from './test-helpers';

test.describe('Custom quest chat rendering', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders QuestChat for custom quests and navigates dialogue', async ({ page }) => {
        await page.goto('/');

        const questId = await seedCustomQuest(page, {
            id: 'custom-quest-chat',
            title: 'Custom Quest Chat',
            description: 'Quest created for chat rendering test.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Custom quest start node.',
                    options: [{ type: 'goto', goto: 'next', text: 'Proceed' }],
                },
                {
                    id: 'next',
                    text: 'Custom quest next node.',
                    options: [{ type: 'finish', text: 'Finish quest' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
        await expect(page.locator('text=Custom quest start node.')).toBeVisible();

        const optionButton = page.getByRole('button', { name: 'Proceed' });
        await expect(optionButton).toBeVisible();
        await optionButton.click();

        await expect(page.locator('text=Custom quest next node.')).toBeVisible();
    });

    test('built-in quest chat still renders', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    });
});
