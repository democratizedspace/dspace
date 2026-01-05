import { expect, test } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';

test.describe('Chat message flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);

        await page.addInitScript(
            ({ reply }) => {
                // @ts-expect-error test hook for OpenAI client
                window.__DSpaceOpenAIClient = function () {
                    return {
                        responses: {
                            create: async () => {
                                await new Promise((resolve) => setTimeout(resolve, 150));
                                return { output_text: reply } as const;
                            },
                        },
                    };
                };
            },
            { reply: LONG_REPLY }
        );
    });

    test('shows loading state and renders assistant replies', async ({ page }) => {
        await page.goto('/chat');
        await waitForHydration(page);

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');

        const spinner = chatPanel.locator('.spinner-container');
        const messageBox = chatPanel.getByRole('textbox');
        await messageBox.fill('Hello from the automated test');

        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText('Hello from the automated test')).toBeVisible();

        await expect(spinner).toBeVisible();

        await expect(chatPanel.getByText(LONG_REPLY)).toBeVisible();

        await expect(spinner).not.toBeVisible();
    });
});
