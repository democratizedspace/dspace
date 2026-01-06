import { expect, test } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';
const FALLBACK_MESSAGE = "Sorry, I'm having some trouble and can't generate a response.";

type StubMode = 'success' | 'network-error' | 'rate-limit' | 'abort';

const installChatStub = async (
    page: Parameters<typeof test['beforeEach']>[0]['page'],
    mode: StubMode
) => {
    await page.addInitScript(
        ({ reply, stubMode }) => {
            const createResponse = async () => {
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

                await new Promise((resolve) => setTimeout(resolve, 150));
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

const openChatPanel = async (page: Parameters<typeof test['beforeEach']>[0]['page']) => {
    await page.goto('/chat');
    await waitForHydration(page);

    const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
    await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');

    return {
        chatPanel,
        spinner: chatPanel.locator('.spinner-container'),
        messageBox: chatPanel.getByRole('textbox'),
    };
};

const sendMessage = async (
    page: Parameters<typeof test['beforeEach']>[0]['page'],
    text: string
) => {
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
        const { chatPanel, spinner } = await sendMessage(
            page,
            'Hello from the automated test'
        );

        await expect(chatPanel.getByText(LONG_REPLY)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('shows user-facing error when network requests fail', async ({ page }) => {
        await installChatStub(page, 'network-error');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a network failure');

        await expect(chatPanel.getByText(/having some trouble/i)).toBeVisible();
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
});
