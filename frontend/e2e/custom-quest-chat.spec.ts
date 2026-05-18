import { test, expect } from '@playwright/test';
import {
    clearUserData,
    flushGameStateWrites,
    seedCustomQuest,
    waitForHydration,
} from './test-helpers';

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

    test('moves completed custom quests out of the active custom list after refreshing /quests', async ({
        page,
    }) => {
        await page.goto('/');

        const questId = await seedCustomQuest(page, {
            id: 'custom-quest-completion-regression',
            title: 'Custom Quest Completion Regression',
            description: 'Quest created for completed custom quest listing regression coverage.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Finish this custom quest to verify completed list placement.',
                    options: [{ type: 'finish', text: 'Finish custom quest' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto(`/quests/${questId}`);
        await waitForHydration(page);

        await page.getByRole('button', { name: /Finish custom quest/ }).click();
        await expect(page.getByRole('heading', { name: 'Quest Complete!' })).toBeVisible();
        await flushGameStateWrites(page);

        await page.goto('/quests');
        await waitForHydration(page);
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

        await expect(page.getByRole('heading', { name: 'Completed Quests' })).toBeVisible();

        const activeCustomQuestCard = page
            .getByTestId('custom-quests-section')
            .locator(`[data-questid="${questId}"]`);
        const completedCustomQuestCard = page.locator(
            `h2:has-text("Completed Quests") ~ a[data-questid="${questId}"]`
        );

        await expect(activeCustomQuestCard).toHaveCount(0);
        await expect(completedCustomQuestCard).toHaveCount(1);
        await expect(
            completedCustomQuestCard.locator('[data-testid="quest-tile"]')
        ).toHaveAttribute('data-status', 'completed');
        await expect(completedCustomQuestCard.getByText('Status: Completed')).toBeVisible();
    });

    test('built-in quest chat still renders', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    });
});
