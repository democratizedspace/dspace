import { expect, test } from '@playwright/test';

import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Chat debug build stamp', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('does not show missing prompt or build metadata', async ({ page }) => {
        await navigateWithRetry(page, '/settings');
        await waitForHydration(page);

        const debugToggle = page.getByTestId('chat-debug-prompt-toggle');
        await expect(debugToggle).toBeVisible();
        if ((await debugToggle.getAttribute('aria-pressed')) !== 'true') {
            await debugToggle.click();
            await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
        }

        await navigateWithRetry(page, '/chat#prompt-debug');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();

        const promptVersion = debugPanel.getByText(/Prompt version:/);
        await expect(promptVersion).toBeVisible();
        await expect(promptVersion).not.toContainText('v3:missing');
        await expect(promptVersion).not.toContainText('v3:dev-local');

        const appRow = debugPanel.getByTestId('debug-app-sha-row');
        const appValue = appRow.locator('.debug-mono');
        await expect(appValue).toBeVisible();
        await expect(appValue).not.toContainText('missing');
        await expect(appValue).not.toContainText('dev-local');

        const appSourceValue = debugPanel
            .getByText('App build SHA source')
            .locator('..')
            .locator('.debug-mono');
        await expect(appSourceValue).toBeVisible();
        await expect(appSourceValue).not.toContainText('missing');

        const comparisonRow = debugPanel.locator('.debug-meta-row', {
            hasText: 'Docs RAG comparison',
        });
        const comparisonValue = comparisonRow.locator('.debug-mono');
        await expect(comparisonValue).toBeVisible();
        await expect(comparisonValue).not.toContainText('cannot verify');
        await expect(comparisonValue).not.toContainText('app SHA missing');
    });
});
