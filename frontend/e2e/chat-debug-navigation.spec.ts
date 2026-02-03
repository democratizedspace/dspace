import { expect, test } from '@playwright/test';

import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Chat debug deep links', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('Settings debug link opens chat prompt payload panel', async ({ page }) => {
        await navigateWithRetry(page, '/settings');
        await waitForHydration(page);

        const debugToggle = page.getByTestId('chat-debug-prompt-toggle');
        await expect(debugToggle).toBeVisible();
        await expect(debugToggle).not.toHaveAttribute('aria-pressed', 'true');

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
        await navigateWithRetry(page, '/chat#prompt-debug');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(page.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
    });

    test('query param navigation auto-expands the prompt payload panel', async ({ page }) => {
        await navigateWithRetry(page, '/chat?debug=prompt');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(page.getByRole('button', { name: 'Hide prompt' })).toBeVisible();
    });
});
