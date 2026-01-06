import { expect, test } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const FALLBACK_MESSAGE = "Sorry, I'm having some trouble and can't generate a response.";

const stubOpenAIClient = async (
    page,
    errorPayload: { message: string; status?: number; code?: string }
) => {
    await page.addInitScript(
        ({ error }) => {
            // @ts-expect-error test hook for OpenAI client
            window.__DSpaceOpenAIClient = function () {
                return {
                    responses: {
                        create: async () => {
                            const err = new Error(error.message);
                            Object.assign(err, error);
                            throw err;
                        },
                    },
                };
            };
        },
        { error: errorPayload }
    );
};

test.describe('Chat error handling', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows a user-facing message when network requests fail', async ({ page }) => {
        await stubOpenAIClient(page, { message: 'Network unreachable' });

        await page.goto('/chat');
        await waitForHydration(
            page,
            '[data-testid="chat-panel"][data-provider="openai"][data-hydrated="true"]'
        );

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        const messageBox = chatPanel.getByRole('textbox');
        await messageBox.fill('Hello from the network test');
        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText('Hello from the network test')).toBeVisible();
        await expect(chatPanel.getByText(FALLBACK_MESSAGE)).toBeVisible();
        await expect(chatPanel.locator('.spinner-container')).not.toBeVisible();
    });

    test('surfaces rate limit failures with the same fallback response', async ({ page }) => {
        await stubOpenAIClient(page, {
            message: 'Rate limit exceeded',
            status: 429,
            code: 'rate_limit_exceeded',
        });

        await page.goto('/chat');
        await waitForHydration(
            page,
            '[data-testid="chat-panel"][data-provider="openai"][data-hydrated="true"]'
        );

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        const messageBox = chatPanel.getByRole('textbox');
        await messageBox.fill('Hello from the rate limit test');
        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText('Hello from the rate limit test')).toBeVisible();
        await expect(chatPanel.getByText(FALLBACK_MESSAGE)).toBeVisible();
        await expect(chatPanel.locator('.spinner-container')).not.toBeVisible();
    });
});
