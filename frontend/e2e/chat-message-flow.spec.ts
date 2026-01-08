import { expect, test } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';

test.describe('Chat message flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    const mockOpenAIReply = async (page, reply) => {
        await page.addInitScript(
            ({ responseText }) => {
                // @ts-expect-error test hook for OpenAI client
                window.__DSpaceOpenAIClient = function () {
                    return {
                        responses: {
                            create: async () => {
                                await new Promise((resolve) => setTimeout(resolve, 150));
                                return { output_text: responseText } as const;
                            },
                        },
                    };
                };
            },
            { responseText: reply }
        );
    };

    const mockOpenAIError = async (page, errorPayload) => {
        await page.addInitScript(
            ({ payload }) => {
                // @ts-expect-error test hook for OpenAI client
                window.__DSpaceOpenAIClient = function () {
                    return {
                        responses: {
                            create: async () => {
                                await new Promise((resolve) => setTimeout(resolve, 150));
                                const error = new Error(payload.message || 'Request failed');
                                if (payload.status) {
                                    error.status = payload.status;
                                }
                                if (payload.code) {
                                    error.code = payload.code;
                                }
                                throw error;
                            },
                        },
                    };
                };
            },
            { payload: errorPayload }
        );
    };

    test('shows loading state and renders assistant replies', async ({ page }) => {
        await mockOpenAIReply(page, LONG_REPLY);
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

    test('shows user-facing error when network requests fail', async ({ page }) => {
        await mockOpenAIError(page, { message: 'NetworkError when attempting to fetch resource.' });
        await page.goto('/chat');
        await waitForHydration(page);

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        const messageBox = chatPanel.getByRole('textbox');
        await messageBox.fill('Trigger a network error');

        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText(/network error/i)).toBeVisible();
    });

    test('surfaces rate limit errors without getting stuck', async ({ page }) => {
        await mockOpenAIError(page, { message: 'Rate limit exceeded', status: 429 });
        await page.goto('/chat');
        await waitForHydration(page);

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        const messageBox = chatPanel.getByRole('textbox');
        await messageBox.fill('Trigger rate limit');

        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText(/rate limit/i)).toBeVisible();
        await expect(chatPanel.locator('.spinner-container')).not.toBeVisible();
    });
});
