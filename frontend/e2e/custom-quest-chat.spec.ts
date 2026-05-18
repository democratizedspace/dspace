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

    test('moves completed custom quests to Completed Quests without active duplicates after refresh', async ({
        page,
    }) => {
        await page.goto('/');

        const questTitle = `Completed Custom Quest ${Date.now()}`;
        const questId = await seedCustomQuest(page, {
            id: `custom-quest-completion-${Date.now()}`,
            title: questTitle,
            description: 'Quest created for completed custom quest listing test.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Complete this custom quest for list classification.',
                    options: [{ type: 'finish', text: 'Finish custom quest' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);
        await page.getByRole('button', { name: 'Finish custom quest' }).click();
        await expect(page.getByRole('heading', { name: 'Quest Complete!' })).toBeVisible();

        const assertCompletedQuestPlacement = async () => {
            await expect(page.getByRole('heading', { name: 'Completed Quests' })).toBeVisible();
            await expect(
                page.locator(
                    `a[data-questid="${questId}"] [data-testid="quest-tile"][data-status="completed"]`
                )
            ).toBeVisible();
            await expect(
                page.getByTestId('quests-grid').locator(`a[data-questid="${questId}"]`)
            ).toHaveCount(0);
            await expect(
                page.getByTestId('custom-quests-section').locator(`a[data-questid="${questId}"]`)
            ).toHaveCount(0);
            await expect(page.locator(`a[data-questid="${questId}"]`)).toHaveCount(1);
        };

        await page.goto('/quests');
        await assertCompletedQuestPlacement();

        await page.reload();
        await assertCompletedQuestPlacement();
    });

    test('built-in quest chat still renders', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    });
});
