import { expect, test } from '@playwright/test';

import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Chat debug navigation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('Settings → Debug opens the chat prompt debug panel', async ({ page }) => {
        await navigateWithRetry(page, '/settings');
        await waitForHydration(page);

        const debugLink = page.getByTestId('settings-debug-link');
        await expect(debugLink).toBeVisible();
        await debugLink.click();

        await page.waitForURL('**/chat#prompt-debug');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(debugPanel.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
    });

    test('direct /chat#prompt-debug navigation auto-expands the panel', async ({ page }) => {
        await navigateWithRetry(page, '/chat#prompt-debug');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(debugPanel.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
    });
});
