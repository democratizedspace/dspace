import { expect, test } from '@playwright/test';

test.describe('chat debug build info', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            const now = Date.now();
            const gameState = {
                _meta: { lastUpdated: now },
                settings: { showChatDebugPayload: true },
            };

            localStorage.setItem('gameState', JSON.stringify(gameState));
            Object.defineProperty(window, 'indexedDB', {
                value: undefined,
                configurable: true,
            });
        });
    });

    test('shows non-unknown build metadata with comparison status', async ({ page }) => {
        await page.goto('/chat');

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toBeVisible();
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');

        const debugPanel = page.locator('[data-testid="chat-debug-panel"]');
        await expect(debugPanel).toBeVisible();

        const promptVersion = debugPanel.getByText(/Prompt version:/);
        await expect(promptVersion).not.toContainText('unknown');

        const appBuildRow = debugPanel.getByText('App build SHA').locator('..');
        const appBuildSha = appBuildRow.locator('.debug-mono');
        await expect(appBuildSha).not.toHaveText('unknown');
        await expect(appBuildSha).toHaveText(/\S+/);

        const docsShaRow = debugPanel.getByText('Docs RAG SHA').locator('..');
        const docsSha = docsShaRow.locator('.debug-mono');
        await expect(docsSha).not.toHaveText('unknown');
        await expect(docsSha).toHaveText(/\S+/);

        const docsGeneratedRow = debugPanel.getByText('Docs RAG generatedAt').locator('..');
        await expect(docsGeneratedRow.locator('.debug-mono')).toHaveText(/\S+/);

        const comparisonRow = debugPanel.getByText('Docs RAG comparison').locator('..');
        const comparisonText = (await comparisonRow.locator('.debug-mono').innerText()).trim();
        expect(comparisonText).toMatch(/✅ in sync|⚠️ mismatch/);
        if (comparisonText.includes('mismatch')) {
            expect(comparisonText).toMatch(/app\s+\S+,\s+docs\s+\S+/);
        }
    });
});
