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

    test('shows prompt/build metadata and comparison status', async ({ page }) => {
        await page.goto('/chat');

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toBeVisible();
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');

        const debugPanel = chatPanel.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();

        const promptVersion = await debugPanel.locator('.debug-version').innerText();
        expect(promptVersion.trim()).not.toEqual('');
        expect(promptVersion).not.toContain('unknown');

        const appBuildRow = debugPanel.locator('.debug-meta-row', {
            hasText: 'App build SHA',
        });
        const appBuildSha = (await appBuildRow.locator('.debug-mono').innerText()).trim();
        expect(appBuildSha).not.toEqual('');
        expect(appBuildSha).not.toContain('unknown');

        const comparisonRow = debugPanel.locator('.debug-meta-row', {
            hasText: 'Docs RAG comparison',
        });
        const comparisonText = await comparisonRow.locator('.debug-mono').innerText();
        expect(comparisonText).toMatch(/✅ in sync|⚠️ mismatch/);
    });
});
