import { expect, test } from '@playwright/test';

import { clearUserData, navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Chat debug build metadata', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows prompt/app/docs build info with sync comparison', async ({ page }) => {
        await navigateWithRetry(page, '/settings');
        await waitForHydration(page);

        const debugToggle = page.getByTestId('chat-debug-prompt-toggle');
        await expect(debugToggle).toBeVisible();
        if ((await debugToggle.getAttribute('aria-pressed')) !== 'true') {
            await debugToggle.click();
            await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
        }

        await navigateWithRetry(page, '/chat');
        await waitForHydration(page, 'data-testid=chat-panel');

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();

        const promptVersion = debugPanel.getByText(/Prompt version:/);
        await expect(promptVersion).toBeVisible();
        await expect(promptVersion).not.toContainText('unknown');

        const appRow = debugPanel.getByTestId('debug-app-sha-row');
        const appValue = appRow.locator('.debug-mono');
        await expect(appValue).toBeVisible();
        await expect(appValue).not.toHaveText('');
        await expect(appValue).not.toContainText('unknown');

        const docsShaRow = debugPanel.locator('.debug-meta-row', { hasText: 'Docs RAG SHA' });
        const docsShaValue = docsShaRow.locator('.debug-mono');
        await expect(docsShaValue).toBeVisible();
        await expect(docsShaValue).not.toHaveText('');

        const docsGeneratedRow = debugPanel.locator('.debug-meta-row', {
            hasText: 'Docs RAG generatedAt',
        });
        const docsGeneratedValue = docsGeneratedRow.locator('.debug-mono');
        await expect(docsGeneratedValue).toBeVisible();
        await expect(docsGeneratedValue).not.toHaveText('');

        const comparisonRow = debugPanel.locator('.debug-meta-row', {
            hasText: 'Docs RAG comparison',
        });
        await expect(comparisonRow.locator('.debug-mono')).toHaveText(
            /✅ in sync|⚠️ mismatch|ℹ️ app SHA missing|ℹ️ docs SHA unavailable/
        );
    });
});
