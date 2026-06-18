import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

type CapturedTokenPlaceRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown> & { messages?: Array<Record<string, unknown>> };
};

const tokenPlacePayload = (content = 'token.place assistant reply') => ({
    id: 'chatcmpl-e2e-token-place',
    object: 'chat.completion',
    created: 1782864000,
    model: 'gpt-5-chat-latest',
    choices: [{ message: { role: 'assistant', content } }],
    usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
    metadata: { client: 'dspace', provider: 'token.place' },
});

const captureTokenPlace = async (
    page: Page,
    url = 'https://token.place/api/v1/chat/completions',
    reply = 'token.place assistant reply'
) => {
    const requests: CapturedTokenPlaceRequest[] = [];
    await page.route(url, async (route) => {
        const request = route.request();
        requests.push({
            method: request.method(),
            url: request.url(),
            headers: request.headers(),
            body: JSON.parse(request.postData() || '{}'),
        });
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(tokenPlacePayload(reply)),
        });
    });
    return requests;
};

const blockLiveProviders = async (page: Page, allowed: string[] = []) => {
    await page.route(
        /https:\/\/(api\.openai\.com|token\.place|staging\.token\.place)\/.*/,
        async (route) => {
            if (allowed.includes(route.request().url())) {
                await route.fallback();
                return;
            }
            throw new Error(`Unexpected live provider request: ${route.request().url()}`);
        }
    );
};

const seedState = async (page: Page, state: Record<string, unknown>) => {
    await page.addInitScript((seededState) => {
        localStorage.setItem('gameState', JSON.stringify(seededState));
    }, state);
};

const openChat = async (page: Page, provider: 'token-place' | 'openai' = 'token-place') => {
    await page.goto('/chat');
    await waitForHydration(page, `[data-testid="chat-panel"][data-provider="${provider}"]`);
    const chatPanel = page.locator(`[data-testid="chat-panel"][data-provider="${provider}"]`);
    await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
    return chatPanel;
};

const sendMessage = async (chatPanel: Locator, message: string) => {
    await chatPanel.getByRole('textbox').fill(message);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
};

const expectSafeTokenPlaceRequest = (request: CapturedTokenPlaceRequest) => {
    expect(request.method).toBe('POST');
    expect(request.url).toMatch(/\/api\/v1\/chat\/completions$/);
    expect(request.headers.authorization).toBeUndefined();
    expect(request.body.model).toBeTruthy();
    expect(Array.isArray(request.body.messages)).toBe(true);
    expect(request.body.stream).not.toBe(true);
    expect(request.body.metadata).toEqual({ client: 'dspace', provider: 'token.place' });

    const serialized = JSON.stringify(request.body);
    expect(serialized).not.toMatch(/sk-|apiKey|openAI|tokenPlaceApiKey|credential|raw save/i);
    expect(serialized).not.toMatch(/token\.place is deferred/i);
    expect(serialized).not.toMatch(/chat uses OpenAI/i);
};

test.describe('Chat provider routing', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('fresh profile defaults to no-auth token.place API v1 chat completions', async ({
        page,
    }) => {
        const requests = await captureTokenPlace(page, undefined, 'Default token.place reply');
        await blockLiveProviders(page, ['https://token.place/api/v1/chat/completions']);

        const chatPanel = await openChat(page, 'token-place');
        await expect(page.getByText(/OpenAI API Key/i)).toHaveCount(0);
        await sendMessage(chatPanel, 'Hello token.place default');

        await expect(chatPanel.getByText('Default token.place reply')).toBeVisible();
        expect(requests).toHaveLength(1);
        expectSafeTokenPlaceRequest(requests[0]);
        expect(requests[0].body.messages.at(-1)).toMatchObject({
            role: 'user',
            content: 'Hello token.place default',
        });
    });

    test('staging token.place base URL override routes without touching production', async ({
        page,
    }) => {
        await seedState(page, {
            settings: { chatProvider: 'token-place' },
            tokenPlace: { url: 'https://staging.token.place/api' },
        });
        const stagingUrl = 'https://staging.token.place/api/v1/chat/completions';
        const requests = await captureTokenPlace(page, stagingUrl, 'Staging token.place reply');
        await blockLiveProviders(page, [stagingUrl]);

        const chatPanel = await openChat(page, 'token-place');
        await sendMessage(chatPanel, 'Use staging please');

        await expect(chatPanel.getByText('Staging token.place reply')).toBeVisible();
        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe(stagingUrl);
        expect(requests[0].url).not.toContain('/api/api/v1/chat/completions');
    });

    test('provider preference persists and OpenAI is selected only by settings opt-in', async ({
        page,
    }) => {
        await page.goto('/settings');
        await waitForHydration(page);

        const settingsPanel = page.getByTestId('chat-provider-settings');
        await settingsPanel.locator('input[name="chat-provider"][value="openai"]').check();
        await page.getByLabel('OpenAI API key', { exact: true }).fill('sk-fake-routing-e2e-key');
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
        await expect(page.getByTestId('openai-key-status')).toHaveText(
            'OpenAI API key configured.'
        );

        await page.reload();
        await waitForHydration(page);
        await expect(
            settingsPanel.locator('input[name="chat-provider"][value="openai"]')
        ).toBeChecked();

        const chatPanel = await openChat(page, 'openai');
        await expect(chatPanel).toHaveAttribute('data-provider', 'openai');
    });

    test('OpenAI opt-in without a key is gated and makes no provider network call', async ({
        page,
    }) => {
        await seedState(page, { settings: { chatProvider: 'openai' }, openAI: { apiKey: '' } });
        const unexpectedCalls: string[] = [];
        await page.route(/https:\/\/(api\.openai\.com|token\.place)\/.*/, async (route) => {
            unexpectedCalls.push(route.request().url());
            await route.abort();
        });

        const chatPanel = await openChat(page, 'openai');
        await sendMessage(chatPanel, 'Do not call a provider');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'missing-key');
        await expect(banner).toContainText(/OpenAI requires an API key/i);
        await expect(banner.getByRole('link', { name: 'Open Settings' })).toHaveAttribute(
            'href',
            '/settings'
        );
        expect(unexpectedCalls).toEqual([]);
    });

    test('switching back to token.place clears OpenAI routing and sends through token.place', async ({
        page,
    }) => {
        await seedState(page, {
            settings: { chatProvider: 'openai' },
            openAI: { apiKey: 'sk-fake-existing-key' },
        });
        const requests = await captureTokenPlace(page, undefined, 'Back on token.place');
        await blockLiveProviders(page, ['https://token.place/api/v1/chat/completions']);

        await page.goto('/settings');
        await waitForHydration(page);
        const settingsPanel = page.getByTestId('chat-provider-settings');
        await page.getByRole('button', { name: 'Clear API key' }).click();
        await settingsPanel.locator('input[name="chat-provider"][value="token-place"]').check();

        const chatPanel = await openChat(page, 'token-place');
        await sendMessage(chatPanel, 'Token place again');

        await expect(chatPanel.getByText('Back on token.place')).toBeVisible();
        expect(requests).toHaveLength(1);
        expectSafeTokenPlaceRequest(requests[0]);
    });

    const errorCases: Array<{
        name: string;
        fulfill?: (route: Route) => Promise<void>;
        errorType: string;
        message: RegExp;
    }> = [
        {
            name: 'network fetch failure',
            fulfill: (route) => route.abort('failed'),
            errorType: 'network',
            message: /could not reach token\.place/i,
        },
        {
            name: 'content policy structured error',
            fulfill: (route) =>
                route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: {
                            message: 'blocked',
                            type: 'content_policy_violation',
                            code: 'content_blocked',
                        },
                    }),
                }),
            errorType: 'content_policy',
            message: /blocked that request by policy/i,
        },
        {
            name: 'HTTP 429 rate or quota error',
            fulfill: (route) =>
                route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: { message: 'slow down', type: 'rate_limit' } }),
                }),
            errorType: 'rate_limit',
            message: /rate limited or out of daily quota/i,
        },
        {
            name: 'HTTP 5xx server unavailable error',
            fulfill: (route) =>
                route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: { message: 'down', type: 'server_error' } }),
                }),
            errorType: 'server',
            message: /temporarily unavailable/i,
        },
        {
            name: 'malformed 200 response',
            fulfill: (route) =>
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ choices: [{ message: { content: '' } }] }),
                }),
            errorType: 'malformed',
            message: /unexpected response/i,
        },
    ];

    for (const errorCase of errorCases) {
        test(`shows token.place banner for ${errorCase.name}`, async ({ page }) => {
            await page.route('https://token.place/api/v1/chat/completions', async (route) => {
                await errorCase.fulfill?.(route);
            });

            const chatPanel = await openChat(page, 'token-place');
            await sendMessage(chatPanel, `Trigger ${errorCase.name}`);

            const banner = chatPanel.locator('.chat-error');
            await expect(banner).toHaveAttribute('data-error-type', errorCase.errorType);
            await expect(banner).toContainText(errorCase.message);
        });
    }

    test('token.place flow preserves persona switching and debug prompt payload structure', async ({
        page,
    }) => {
        const requests = await captureTokenPlace(page, undefined, 'Debuggable token.place reply');
        await seedState(page, {
            settings: { chatProvider: 'token-place', showChatDebugPayload: true },
        });
        await blockLiveProviders(page, ['https://token.place/api/v1/chat/completions']);

        const chatPanel = await openChat(page, 'token-place');
        await chatPanel.getByLabel('Talk to').selectOption('hydro');
        await expect(chatPanel.locator('.persona-summary')).toHaveText(
            'Hydroponics caretaker focused on nutrient balance.'
        );

        await sendMessage(chatPanel, 'What should I grow next?');
        await expect(chatPanel.getByText('Debuggable token.place reply')).toBeVisible();

        await expect(chatPanel.getByTestId('chat-debug-panel')).toBeVisible();
        await expect(
            chatPanel.locator('[data-testid="chat-debug-message"][data-kind="system"]')
        ).toBeVisible();
        await expect(
            chatPanel.locator('[data-testid="chat-debug-message"][data-kind="persona"]')
        ).toBeVisible();
        await expect(
            chatPanel.locator('[data-testid="chat-debug-message"][data-kind="player-state"]')
        ).toBeVisible();
        await expect(
            chatPanel.locator('[data-testid="chat-debug-message"][data-kind="rag"]')
        ).toBeVisible();
        await expect(chatPanel.locator('[data-testid="chat-debug-message"]').last()).toContainText(
            'What should I grow next?'
        );

        const debugText = await chatPanel.getByTestId('chat-debug-panel').innerText();
        expect(debugText).not.toMatch(/token\.place is deferred/i);
        expect(debugText).not.toMatch(/chat uses OpenAI/i);
        expect(JSON.stringify(requests[0].body.messages)).not.toMatch(/token\.place is deferred/i);
        expect(JSON.stringify(requests[0].body.messages)).not.toMatch(/chat uses OpenAI/i);
    });
});
