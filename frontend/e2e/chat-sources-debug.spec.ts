import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const installChatStub = async (page: Page) => {
    await page.addInitScript(
        ({ reply }) => {
            const now = Date.now();
            const gameState = {
                _meta: { lastUpdated: now },
                settings: { showChatDebugPayload: true },
            };

            localStorage.setItem('gameState', JSON.stringify(gameState));

            // @ts-expect-error test hook for OpenAI client
            window.__DSpaceOpenAIClient = function () {
                return {
                    responses: {
                        create: async () => ({ output_text: reply }),
                    },
                };
            };
        },
        { reply: 'stubbed reply' }
    );
};

test.describe('chat sources and debug payload highlighting', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await installChatStub(page);
    });

    test('renders sources used and highlights rag payloads', async ({ page }) => {
        await page.goto('/chat');
        await waitForHydration(page);

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toBeVisible();

        await chatPanel.getByRole('textbox').fill('What are the current game routes?');
        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText('stubbed reply')).toBeVisible();

        const sourcesDetails = chatPanel.locator('[data-testid="sources-used"]').last();
        await expect(sourcesDetails).toBeVisible();
        await sourcesDetails.getByText('Sources used').click();

        const routeSource = sourcesDetails.locator(
            '[data-testid="source-item"][data-source-type="route"]'
        );
        await expect(routeSource).toHaveAttribute('data-source-url', /\/docs\/routes/);

        await chatPanel.getByRole('button', { name: 'Show prompt' }).click();
        await expect(
            chatPanel.locator('[data-testid="chat-debug-message"][data-kind="rag"]')
        ).toBeVisible();
    });
});
