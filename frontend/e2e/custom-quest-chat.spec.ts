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

    test('moves completed custom quests to Completed Quests after refresh without active duplicates', async ({
        page,
    }) => {
        const questId = await seedCustomQuest(page, {
            id: 'completed-custom-quest-chat',
            title: 'Completed Custom Quest Chat',
            description: 'Quest created for completed custom quest placement testing.',
            route: '/quests/completed-custom-quest-chat',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Complete this custom quest for list placement.',
                    options: [{ type: 'finish', text: 'Finish completed custom quest' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

        await page.getByRole('button', { name: /Finish completed custom quest/ }).click();
        await expect(page.getByRole('heading', { name: 'Quest Complete!' })).toBeVisible();

        await page.goto('/quests');
        await expect(page.getByTestId('custom-quests-merge-status')).toHaveAttribute(
            'data-merge-complete',
            'true'
        );

        await page.reload();
        await waitForHydration(page);
        await expect(page.getByTestId('custom-quests-merge-status')).toHaveAttribute(
            'data-merge-complete',
            'true'
        );
        await expect(page.getByTestId('custom-quests-merge-status')).toHaveAttribute(
            'data-custom-count',
            '0'
        );

        const completedSection = page.getByTestId('completed-quests-section');
        const completedQuestCard = completedSection.locator(`a[data-questid="${questId}"]`);
        await expect(completedSection).toBeVisible();
        await expect(completedQuestCard).toHaveCount(1);
        await expect(completedQuestCard).toContainText('Completed Custom Quest Chat');
        await expect(completedQuestCard).toContainText('Status: Completed');

        await expect(
            page.getByTestId('quests-grid').locator(`a[data-questid="${questId}"]`)
        ).toHaveCount(0);
        await expect(
            page.getByTestId('custom-quests-section').locator(`a[data-questid="${questId}"]`)
        ).toHaveCount(0);
        await expect(page.locator(`a[data-questid="${questId}"]`)).toHaveCount(1);
    });

    test('built-in quest chat still renders', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    });
});
