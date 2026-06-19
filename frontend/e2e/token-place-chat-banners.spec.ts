import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

type TokenPlaceStubMode =
    | 'network-error'
    | 'content-policy'
    | 'rate-limit'
    | 'server-error'
    | 'malformed'
    | 'provider-error'
    | 'unexpected-http-error';

const installTokenPlaceStub = async (page: Page, mode: TokenPlaceStubMode) => {
    await page.route('https://token.place/api/v1/chat/completions', async (route) => {
        if (mode === 'network-error') {
            await route.abort('failed');
            return;
        }

        if (mode === 'content-policy') {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: {
                        message: 'Content blocked',
                        type: 'content_policy_violation',
                        code: 'content_blocked',
                    },
                }),
            });
            return;
        }

        if (mode === 'rate-limit') {
            await route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({ error: { message: 'Slow down', type: 'rate_limit' } }),
            });
            return;
        }

        if (mode === 'server-error') {
            await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { message: 'Unavailable', type: 'server_error' },
                }),
            });
            return;
        }

        if (mode === 'malformed') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ choices: [{ message: { content: '' } }] }),
            });
            return;
        }

        if (mode === 'provider-error') {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ error: { message: 'Provider down' } }),
            });
            return;
        }

        if (mode === 'unexpected-http-error') {
            await route.fulfill({
                status: 418,
                contentType: 'application/json',
                body: JSON.stringify({ error: { message: 'Unexpected token.place failure' } }),
            });
        }
    });
};

const seedTokenPlaceDefaultState = async (page: Page) => {
    await page.addInitScript(() => {
        const state = {
            quests: {},
            inventory: {},
            processes: {},
            settings: { chatProvider: 'token-place' },
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        };
        localStorage.setItem('gameState', JSON.stringify(state));
    });
};

const openTokenPlacePanel = async (page: Page) => {
    await page.goto('/chat');
    await waitForHydration(page);

    const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="token-place"]');
    await expect(chatPanel).toBeVisible();
    const messageBox = chatPanel.getByRole('textbox');
    await expect(messageBox).toBeEnabled();

    return {
        chatPanel,
        spinner: chatPanel.locator('.spinner-container'),
        messageBox,
    };
};

const sendMessage = async (page: Page, text: string) => {
    const { chatPanel, spinner, messageBox } = await openTokenPlacePanel(page);
    await messageBox.fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
    await expect(chatPanel.getByText(text)).toBeVisible();

    return { chatPanel, spinner };
};

test.describe('Token.place chat error banners', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    const cases: Array<{
        name: string;
        mode: TokenPlaceStubMode;
        type: string;
        message: RegExp;
    }> = [
        {
            name: 'shows a network banner when token.place is unreachable',
            mode: 'network-error',
            type: 'network',
            message: /could not reach token\.place/i,
        },
        {
            name: 'shows a content-policy-safe banner when token.place blocks content',
            mode: 'content-policy',
            type: 'content_policy',
            message: /blocked that request by policy|rephrasing/i,
        },
        {
            name: 'shows a rate/quota banner when token.place returns HTTP 429',
            mode: 'rate-limit',
            type: 'rate_limit',
            message: /rate limit|quota|too many/i,
        },
        {
            name: 'shows a server unavailable banner when token.place returns HTTP 5xx',
            mode: 'server-error',
            type: 'server',
            message: /unavailable|server/i,
        },
        {
            name: 'shows a malformed response banner when token.place returns no assistant text',
            mode: 'malformed',
            type: 'malformed',
            message: /unexpected response/i,
        },
        {
            name: 'shows a provider banner when token.place returns an unclassified API error',
            mode: 'provider-error',
            type: 'provider',
            message: /token\.place returned an error/i,
        },
        {
            name: 'shows a provider banner when token.place returns unexpected HTTP errors',
            mode: 'unexpected-http-error',
            type: 'provider',
            message: /token\.place returned an error/i,
        },
    ];

    for (const { name, mode, type, message } of cases) {
        test(name, async ({ page }) => {
            await installTokenPlaceStub(page, mode);
            await seedTokenPlaceDefaultState(page);

            const { chatPanel, spinner } = await sendMessage(page, `Trigger ${mode}`);

            const banner = chatPanel.locator('.chat-error');
            await expect(banner).toHaveAttribute('data-error-type', type);
            await expect(banner).toContainText(message);
            await expect(banner).not.toContainText(/OpenAI/i);
            await expect(spinner).not.toBeVisible();
        });
    }
});
