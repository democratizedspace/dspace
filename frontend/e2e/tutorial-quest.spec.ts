import { test, expect, Page, Locator } from '@playwright/test';
import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Tutorial Quest', () => {
    // Configure test timeouts
    test.setTimeout(60000); // 60 seconds timeout

    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should complete the How to do quests tutorial', async ({ page }) => {
        // Go directly to the tutorial quest
        await navigateWithRetry(page, '/quests/welcome/howtodoquests');
        await waitForHydration(page);

        // Verify the chat container is visible and ready
        const chatPanel = page.getByTestId('chat-panel');
        await expect(chatPanel).toBeVisible({ timeout: 15000 });

        // Interact with the tutorial quest
        await interactWithQuestTutorial(page);

        // Confirm completion state is rendered
        await expect(chatPanel.getByText('Quest Complete!', { exact: false })).toBeVisible({
            timeout: 10000,
        });
        await expect(chatPanel.getByText('Complete')).toBeVisible();

        // Navigate back to quests page
        await navigateWithRetry(page, '/quests');
        await page.waitForLoadState('networkidle');
    });
});

// Helper function to interact with dialogue options
async function interactWithQuestTutorial(page: Page): Promise<void> {
    const chatPanel = page.getByTestId('chat-panel');
    const dialogue = chatPanel.locator('.npcDialogue');

    await waitForDialogue(dialogue, 'Greetings, adventurer');
    await clickQuestOption(page, 'A quest, you say? Tell me more.');

    await waitForDialogue(dialogue, 'Your quest, dear player');
    await clickQuestOption(page, 'I got this, no need for a tutorial!');

    await waitForDialogue(dialogue, 'Aha! A seasoned adventurer');
    await claimItemsForOption(page, "What's this?");

    const skipButton = page.getByRole('button', { name: 'Alright, now can I skip?' });
    await expect(skipButton).toBeEnabled({ timeout: 5000 });
    await skipButton.click();

    await waitForDialogue(dialogue, "Yes. Alright, well, I'll see you");

    const finishButton = page.getByRole('button', { name: 'Bye, dChat!' });
    await expect(finishButton).toBeEnabled({ timeout: 5000 });
    await finishButton.click();
}

async function waitForDialogue(dialogue: Locator, text: string): Promise<void> {
    await expect(dialogue).toContainText(text, { timeout: 10000 });
}

async function clickQuestOption(page: Page, text: string): Promise<void> {
    const optionButton = page.getByRole('button', { name: text });
    await expect(optionButton).toBeVisible({ timeout: 5000 });
    await expect(optionButton).toBeEnabled({ timeout: 5000 });
    await optionButton.click();
}

async function claimItemsForOption(page: Page, optionText: string): Promise<void> {
    const optionsContainer = page.locator('[data-testid="chat-panel"] .options');
    const optionGroup = optionsContainer
        .locator('div')
        .filter({ has: page.getByRole('button', { name: optionText }) })
        .first();

    const claimButton = optionGroup.getByRole('button', { name: 'Claim' });
    await expect(optionGroup).toBeVisible({ timeout: 5000 });
    await expect(claimButton).toBeVisible({ timeout: 5000 });
    await expect(claimButton).toBeEnabled({ timeout: 5000 });
    await claimButton.click();
    await expect(claimButton).toBeDisabled({ timeout: 5000 });
}
