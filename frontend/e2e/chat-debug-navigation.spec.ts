import { expect, test } from '@playwright/test';

import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Chat debug navigation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    async function enableChatDebug(page) {
        await navigateWithRetry(page, '/settings');
        await waitForHydration(page);

        const debugToggle = page.getByTestId('chat-debug-prompt-toggle');
        await expect(debugToggle).toBeVisible();
        if ((await debugToggle.getAttribute('aria-pressed')) !== 'true') {
            await debugToggle.click();
            await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
        }
    }

    test('Settings → Debug opens the chat prompt payload view', async ({ page }) => {
        await enableChatDebug(page);

        const debugLink = page.getByTestId('settings-debug-link');
        await expect(debugLink).toBeVisible();
        await debugLink.click();

        await waitForHydration(page, 'data-testid=chat-panel');
        await expect(page).toHaveURL(/\/chat#prompt-debug/);

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(debugPanel.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
        await expect(
            debugPanel.getByText('Send a message to view the prompt payload.')
        ).toBeVisible();
    });

    test('Direct /chat#prompt-debug expands the prompt payload panel', async ({ page }) => {
        await enableChatDebug(page);
        await navigateWithRetry(page, '/chat#prompt-debug');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(debugPanel.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
    });
});
