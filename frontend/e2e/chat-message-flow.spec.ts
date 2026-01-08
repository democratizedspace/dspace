import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';
const FALLBACK_MESSAGE = "Sorry, I'm having some trouble and can't generate a response.";

type StubMode = 'success' | 'network-error' | 'rate-limit' | 'abort';

const installChatStub = async (page: Page, mode: StubMode) => {
    await page.addInitScript(
        ({ reply, stubMode }) => {
            const createResponse = async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));

                if (stubMode === 'network-error') {
                    throw new Error('Network connection failed');
                }

                if (stubMode === 'rate-limit') {
                    const error = new Error('Rate limit exceeded');
                    // @ts-expect-error non-standard property for tests
                    error.status = 429;
                    throw error;
                }

                if (stubMode === 'abort') {
                    throw new DOMException('The operation was aborted.', 'AbortError');
                }

                return { output_text: reply } as const;
            };

            // @ts-expect-error test hook for OpenAI client
            window.__DSpaceOpenAIClient = function () {
                return {
                    responses: {
                        create: createResponse,
                    },
                };
            };
        },
        { reply: LONG_REPLY, stubMode: mode }
    );
};

const openChatPanel = async (page: Page) => {
    await page.goto('/chat');
    await waitForHydration(page);

    const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
    await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
    const messageBox = chatPanel.getByRole('textbox');
    await expect(messageBox).toBeEnabled();

    return {
        chatPanel,
        spinner: chatPanel.locator('.spinner-container'),
        messageBox,
    };
};

const sendMessage = async (page: Page, text: string) => {
    const { chatPanel, spinner, messageBox } = await openChatPanel(page);
    await messageBox.fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
    await expect(chatPanel.getByText(text)).toBeVisible();
    await expect(spinner).toBeVisible();

    return { chatPanel, spinner };
};

test.describe('Chat message flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    const mockOpenAIReply = async (page: Page, reply: string) => {
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

    const mockOpenAIError = async (
        page: Page,
        errorPayload: { message?: string; status?: number; code?: string }
    ) => {
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
                                    // @ts-expect-error non-standard property for tests
                                    error.status = payload.status;
                                }
                                if (payload.code) {
                                    // @ts-expect-error non-standard property for tests
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
        const { chatPanel, spinner } = await sendMessage(page, 'Hello from the automated test');

        await expect(chatPanel.getByText(LONG_REPLY)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('shows user-facing error when network requests fail', async ({ page }) => {
        await installChatStub(page, 'network-error');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a network failure');

        await expect(chatPanel.getByText(FALLBACK_MESSAGE)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces rate limit errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'rate-limit');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a rate limit');

        await expect(chatPanel.getByText(FALLBACK_MESSAGE)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('clears loading state when requests are aborted', async ({ page }) => {
        await installChatStub(page, 'abort');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger an abort');

        await expect(chatPanel.getByText(FALLBACK_MESSAGE)).toBeVisible();
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
