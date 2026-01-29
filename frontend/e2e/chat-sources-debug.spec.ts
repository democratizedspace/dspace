import { expect, test } from '@playwright/test';

test.describe('chat sources and debug prompt', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            const now = Date.now();
            const gameState = {
                _meta: { lastUpdated: now },
                settings: { showChatDebugPayload: true },
            };

            localStorage.setItem('gameState', JSON.stringify(gameState));

            // @ts-expect-error test hook
            window.__DSpaceOpenAIClient = function () {
                return {
                    responses: {
                        create: async () => ({ output_text: 'stubbed reply' }),
                    },
                };
            };
        });
    });

    test('shows sources used and highlights RAG prompt blocks', async ({ page }) => {
        await page.goto('/chat');

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toBeVisible();
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');

        await chatPanel.getByRole('textbox').fill('What are the current game routes?');
        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText('stubbed reply')).toBeVisible();

        const sourcesDetails = chatPanel.locator('[data-testid="assistant-sources"]').first();
        await sourcesDetails.getByText('Sources used').click();
        await expect(sourcesDetails).toHaveAttribute('open', '');

        const routeLink = sourcesDetails.locator('a').filter({
            hasText: '/docs/routes',
        });
        await expect(routeLink).toBeVisible();

        const debugPanel = chatPanel.locator('[data-testid="chat-debug-panel"]');
        await expect(debugPanel).toBeVisible();
        await debugPanel.getByRole('button', { name: 'Show prompt' }).click();

        await expect(debugPanel.locator('.debug-message.rag')).toBeVisible();
    });
});
