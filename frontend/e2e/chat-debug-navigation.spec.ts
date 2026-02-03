import { expect, test } from '@playwright/test';

import type { Page } from './test-helpers';
import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

const enableChatDebug = async (page: Page) => {
    await navigateWithRetry(page, '/settings');
    await waitForHydration(page);

    const debugToggle = page.getByTestId('chat-debug-prompt-toggle');
    await expect(debugToggle).toBeVisible();
    if ((await debugToggle.getAttribute('aria-pressed')) !== 'true') {
        await debugToggle.click();
        await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
    }
};

test.describe('Chat debug deep links', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('Settings debug link opens chat prompt payload panel', async ({ page }) => {
        await enableChatDebug(page);

        const debugLink = page.getByTestId('settings-debug-link');
        await expect(debugLink).toBeVisible();
        await debugLink.click();

        await expect(page).toHaveURL(/\/chat#prompt-debug$/);
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(page.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
        await expect(page.getByText('Send a message to view the prompt payload.')).toBeVisible();
    });

    test('direct navigation auto-expands the prompt payload panel', async ({ page }) => {
        await enableChatDebug(page);

        await navigateWithRetry(page, '/chat#prompt-debug');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(page.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
    });
});
