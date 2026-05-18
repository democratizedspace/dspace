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

    test('moves completed custom quests to Completed Quests after refreshing /quests', async ({
        page,
    }) => {
        await page.goto('/');

        const questId = await seedCustomQuest(page, {
            id: 'custom-quest-chat-completed',
            title: 'Custom Quest Chat Completed',
            description: 'Quest created for completed custom quest regression test.',
            route: '/quests/custom-quest-chat-completed',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Complete this custom quest from chat.',
                    options: [{ type: 'finish', text: 'Finish custom quest' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

        await page.getByRole('button', { name: 'Finish custom quest' }).click();
        await expect(page.getByText('Complete', { exact: true })).toBeVisible();

        await page.goto('/quests');
        await page.reload();
        await waitForHydration(page);
        await expect(page.getByTestId('custom-quests-merge-status')).toHaveAttribute(
            'data-merge-complete',
            'true'
        );

        const customSection = page.getByTestId('custom-quests-section');
        await expect(customSection).toHaveCount(0);

        const completedSection = page.getByTestId('completed-quests-section');
        await expect(completedSection).toBeVisible();
        await expect(completedSection.locator(`a[data-questid='${questId}']`)).toHaveCount(1);
        await expect(completedSection).toContainText('Custom Quest Chat Completed');
        await expect(
            completedSection.locator(`a[data-questid='${questId}']`).getByText('Status: Completed')
        ).toHaveCount(1);
        await expect(page.locator(`a[data-questid='${questId}']`)).toHaveCount(1);
    });

    test('built-in quest chat still renders', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    });
});
