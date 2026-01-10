import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';
const UNBROKEN_LINE = 'A'.repeat(400);
const UNBROKEN_REPLY = 'B'.repeat(400);
const FALLBACK_MESSAGE = "Sorry, I'm having some trouble and can't generate a response.";
const NETWORK_ERROR_MESSAGE = /could not reach openai/i;
const RATE_LIMIT_MESSAGE = /openai rate limited/i;

type StubMode = 'success' | 'network-error' | 'rate-limit' | 'abort';

const installChatStub = async (page: Page, mode: StubMode, replyText = LONG_REPLY) => {
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
        { reply: replyText, stubMode: mode }
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

        await expect(chatPanel.getByText(NETWORK_ERROR_MESSAGE)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('surfaces rate limit errors without getting stuck', async ({ page }) => {
        await installChatStub(page, 'rate-limit');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger a rate limit');

        await expect(chatPanel.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('clears loading state when requests are aborted', async ({ page }) => {
        await installChatStub(page, 'abort');
        const { chatPanel, spinner } = await sendMessage(page, 'Trigger an abort');

        await expect(chatPanel.getByText(FALLBACK_MESSAGE)).toBeVisible();
        await expect(spinner).not.toBeVisible();
    });

    test('wraps long unbroken messages without overflowing', async ({ page }) => {
        await installChatStub(page, 'success', UNBROKEN_REPLY);
        const { chatPanel } = await sendMessage(page, UNBROKEN_LINE);

        await expect(chatPanel.getByText(UNBROKEN_REPLY)).toBeVisible();

        const pageOverflow = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;

            return {
                docScrollWidth: doc.scrollWidth,
                docClientWidth: doc.clientWidth,
                bodyScrollWidth: body?.scrollWidth ?? 0,
                bodyClientWidth: body?.clientWidth ?? 0,
            };
        });
        const maxAllowedPageWidth = pageOverflow.docClientWidth + 1;
        expect(pageOverflow.docScrollWidth).toBeLessThanOrEqual(maxAllowedPageWidth);
        expect(pageOverflow.bodyScrollWidth).toBeLessThanOrEqual(maxAllowedPageWidth);

        const overflowMetrics = await chatPanel.locator('.message-bubble').evaluateAll((nodes) =>
            nodes.map((node) => ({
                scrollWidth: node.scrollWidth,
                clientWidth: node.clientWidth,
            }))
        );

        for (const metric of overflowMetrics) {
            // Allow up to 1px difference to account for subpixel rounding differences between
            // scrollWidth and clientWidth in different browsers and zoom levels. Any larger
            // difference would indicate a real horizontal overflow regression.
            const maxAllowedScrollWidth = metric.clientWidth + 1;
            expect(metric.scrollWidth).toBeLessThanOrEqual(maxAllowedScrollWidth);
        }
    });
});
