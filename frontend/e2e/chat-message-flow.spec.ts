import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';
const FALLBACK_MESSAGE = "Sorry, I'm having some trouble and can't generate a response.";
const NETWORK_ERROR_MESSAGE = /could not reach openai/i;
const RATE_LIMIT_MESSAGE = /openai rate limited/i;
const QUOTA_MESSAGE = /out of credits/i;
const AUTH_MESSAGE = /api key/i;
const PERMISSION_MESSAGE = /denied access/i;
const SERVER_MESSAGE = /unavailable right now/i;

type StubMode =
    | 'success'
    | 'network-error'
    | 'rate-limit'
    | 'quota'
    | 'auth'
    | 'permission'
    | 'server'
    | 'unknown'
    | 'abort';

const installChatStub = async (page: Page, mode: StubMode) => {
    await page.addInitScript(
        ({ reply, stubMode }) => {
            const createResponse = async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));

                if (stubMode === 'network-error') {
                    const error = new TypeError('');
                    // @ts-expect-error non-standard property for tests
                    error.cause = new TypeError('');
                    throw error;
                }

                if (stubMode === 'rate-limit') {
                    const error = new Error('Rate limit exceeded');
                    // @ts-expect-error non-standard property for tests
                    error.status = 429;
                    throw error;
                }

                if (stubMode === 'quota') {
                    const error = new Error('You exceeded your current quota');
                    // @ts-expect-error non-standard property for tests
                    error.status = 429;
                    // @ts-expect-error non-standard property for tests
                    error.code = 'insufficient_quota';
                    // @ts-expect-error non-standard property for tests
                    error.error = { type: 'insufficient_quota' };
                    throw error;
                }

                if (stubMode === 'auth') {
                    const error = new Error('Incorrect API key provided');
                    // @ts-expect-error non-standard property for tests
                    error.status = 401;
                    throw error;
                }

                if (stubMode === 'permission') {
                    const error = new Error('The model does not exist');
                    // @ts-expect-error non-standard property for tests
                    error.status = 404;
                    // @ts-expect-error non-standard property for tests
                    error.code = 'model_not_found';
                    throw error;
                }

                if (stubMode === 'server') {
                    const error = new Error('Service unavailable');
                    // @ts-expect-error non-standard property for tests
                    error.status = 503;
                    throw error;
                }

                if (stubMode === 'unknown') {
                    const error = new Error('Unexpected server payload');
                    // @ts-expect-error non-standard property for tests
                    error.status = 418;
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

    test('shows loading state and renders assistant replies', async ({ page }) => {
        await installChatStub(page, 'success');
        const { chatPanel, spinner } = await sendMessage(page, 'Hello from the automated test');

        await expect(chatPanel.getByText(LONG_REPLY)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('shows user-facing error when network requests fail', async ({ page }) => {
        await installChatStub(page, 'network-error');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a network failure');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'network');
        await expect(banner).toContainText(NETWORK_ERROR_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(NETWORK_ERROR_MESSAGE)
        ).toBeVisible();
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(FALLBACK_MESSAGE)
        ).toHaveCount(0);
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces rate limit errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'rate-limit');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a rate limit');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'rate_limit');
        await expect(banner).toContainText(RATE_LIMIT_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(RATE_LIMIT_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces quota errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'quota');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a quota error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'quota');
        await expect(banner).toContainText(QUOTA_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(QUOTA_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces API key errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'auth');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger an auth error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'auth');
        await expect(banner).toContainText(AUTH_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(AUTH_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces model access errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'permission');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a model access error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'permission');
        await expect(banner).toContainText(PERMISSION_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(PERMISSION_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces provider outages without getting stuck', async ({ page }) => {
        await installChatStub(page, 'server');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a provider outage');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'server');
        await expect(banner).toContainText(SERVER_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(SERVER_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces unknown errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'unknown');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger an unknown error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'unknown');
        await expect(banner).toContainText(FALLBACK_MESSAGE);
        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(FALLBACK_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('clears loading state when requests are aborted', async ({ page }) => {
        await installChatStub(page, 'abort');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger an abort');

        await expect(
            chatPanel.locator('.message-bubble.assistant').getByText(FALLBACK_MESSAGE)
        ).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });
});
