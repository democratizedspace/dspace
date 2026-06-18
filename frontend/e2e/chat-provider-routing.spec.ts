import { expect, test, type Page, type Route } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const TOKEN_PLACE_URL = 'https://token.place/api/v1/chat/completions';
const STAGING_TOKEN_PLACE_URL = 'https://staging.token.place/api/v1/chat/completions';
const ASSISTANT_REPLY = 'token.place provider routing reply';
const FAKE_OPENAI_KEY = 'sk-test-fake-provider-routing-key';
const STALE_PROVIDER_WORDING =
    /token\.place is deferred|In v3, chat uses OpenAI|OpenAI-only in v3/i;

type CapturedTokenPlaceRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
};

const tokenPlaceResponse = (content = ASSISTANT_REPLY) => ({
    id: 'chatcmpl-e2e-token-place',
    object: 'chat.completion',
    created: 1_782_000_000,
    model: 'gpt-5-chat-latest',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
    metadata: { client: 'dspace', provider: 'token.place', request_id: 'tp-e2e' },
});

const fulfillJson = async (route: Route, status: number, body: Record<string, unknown>) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
};

const routeTokenPlaceSuccess = async (page: Page, url = TOKEN_PLACE_URL) => {
    const requests: CapturedTokenPlaceRequest[] = [];
    await page.route(url, async (route) => {
        const request = route.request();
        requests.push({
            method: request.method(),
            url: request.url(),
            headers: request.headers(),
            body: JSON.parse(request.postData() || '{}'),
        });
        await fulfillJson(route, 200, tokenPlaceResponse());
    });
    return requests;
};

const blockLiveProviders = async (page: Page, calls: string[] = []) => {
    await page.route(
        /https:\/\/(api\.openai\.com|token\.place|staging\.token\.place)\//,
        async (route) => {
            calls.push(route.request().url());
            await route.abort('blockedbyclient');
        }
    );
};

const seedGameState = async (page: Page, state: Record<string, unknown>) => {
    await page.addInitScript((nextState) => {
        localStorage.setItem('gameState', JSON.stringify(nextState));
    }, state);
};

const openChat = async (page: Page, provider: 'token-place' | 'openai') => {
    await page.goto('/chat');
    await waitForHydration(
        page,
        `[data-testid="chat-panel"][data-provider="${provider}"][data-hydrated="true"]`
    );
    const chatPanel = page.locator(`[data-testid="chat-panel"][data-provider="${provider}"]`);
    await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
    return chatPanel;
};

const sendChatMessage = async (chatPanel: ReturnType<Page['locator']>, text: string) => {
    await chatPanel.getByRole('textbox').fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
    await expect(chatPanel.getByText(text)).toBeVisible();
};

const expectSafeTokenPlaceRequest = (
    captured: CapturedTokenPlaceRequest,
    expectedUrl = TOKEN_PLACE_URL
) => {
    expect(captured.method).toBe('POST');
    expect(captured.url).toBe(expectedUrl);
    expect(captured.url).toMatch(/\/api\/v1\/chat\/completions$/);
    expect(captured.headers.authorization).toBeUndefined();
    expect(captured.body).toHaveProperty('model');
    expect(captured.body).toHaveProperty('messages');
    expect(captured.body.stream).not.toBe(true);
    expect(captured.body.metadata).toEqual({ client: 'dspace', provider: 'token.place' });
    const serialized = JSON.stringify(captured.body);
    expect(serialized).not.toContain('apiKey');
    expect(serialized).not.toContain('openAI');
    expect(serialized).not.toContain('tokenPlace');
    expect(serialized).not.toContain(FAKE_OPENAI_KEY);
    expect(serialized).not.toMatch(STALE_PROVIDER_WORDING);
};

const chooseProvider = async (page: Page, provider: 'token-place' | 'openai') => {
    await page.goto('/settings');
    await waitForHydration(page, '[data-testid="chat-provider-settings"][data-hydrated="true"]');
    await page.locator(`input[name="chat-provider"][value="${provider}"]`).check();
    await expect(page.locator(`input[name="chat-provider"][value="${provider}"]`)).toBeChecked();
};

test.describe('Chat provider routing', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('fresh profile defaults to no-auth token.place API v1 and renders the assistant reply', async ({
        page,
    }) => {
        const requests = await routeTokenPlaceSuccess(page);

        const chatPanel = await openChat(page, 'token-place');
        await expect(page.locator('[data-testid="chat-panel"]')).toHaveCount(1);
        await expect(page.getByLabel('OpenAI API key', { exact: true })).toHaveCount(0);

        await sendChatMessage(chatPanel, 'Route this fresh profile through token.place');
        await expect(chatPanel.getByText(ASSISTANT_REPLY)).toBeVisible();
        expect(requests).toHaveLength(1);
        expectSafeTokenPlaceRequest(requests[0]);
    });

    test('staging token.place base URL override can be used without live provider calls', async ({
        page,
    }) => {
        await seedGameState(page, { tokenPlace: { url: 'https://staging.token.place/api' } });
        const requests = await routeTokenPlaceSuccess(page, STAGING_TOKEN_PLACE_URL);
        const blockedCalls: string[] = [];
        await page.route(TOKEN_PLACE_URL, async (route) => {
            blockedCalls.push(route.request().url());
            await route.abort('blockedbyclient');
        });

        const chatPanel = await openChat(page, 'token-place');
        await sendChatMessage(chatPanel, 'Use staging token place');
        await expect(chatPanel.getByText(ASSISTANT_REPLY)).toBeVisible();
        expect(requests).toHaveLength(1);
        expect(blockedCalls).toEqual([]);
        expectSafeTokenPlaceRequest(requests[0], STAGING_TOKEN_PLACE_URL);
    });

    test('provider preference persists and OpenAI is selected only after Settings opt-in', async ({
        page,
    }) => {
        await chooseProvider(page, 'openai');
        await page.getByLabel('OpenAI API key', { exact: true }).fill(FAKE_OPENAI_KEY);
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
        await expect(page.getByTestId('openai-key-status')).toHaveText(
            'OpenAI API key configured.'
        );

        await page.reload();
        await waitForHydration(
            page,
            '[data-testid="chat-provider-settings"][data-hydrated="true"]'
        );
        await expect(page.locator('input[name="chat-provider"][value="openai"]')).toBeChecked();

        const chatPanel = await openChat(page, 'openai');
        await expect(chatPanel).toHaveAttribute('data-provider', 'openai');
    });

    test('OpenAI opt-in without a saved key is gated and makes no provider request', async ({
        page,
    }) => {
        await seedGameState(page, { settings: { chatProvider: 'openai' }, openAI: { apiKey: '' } });
        const providerCalls: string[] = [];
        await blockLiveProviders(page, providerCalls);

        const chatPanel = await openChat(page, 'openai');
        await sendChatMessage(chatPanel, 'Try OpenAI without a key');
        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'missing-key');
        await expect(banner).toContainText(/OpenAI requires an API key/i);
        await expect(providerCalls).toEqual([]);
    });

    test('switching back to token.place clears provider routing and sends successfully', async ({
        page,
    }) => {
        await chooseProvider(page, 'openai');
        await page.getByLabel('OpenAI API key', { exact: true }).fill(FAKE_OPENAI_KEY);
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
        await chooseProvider(page, 'token-place');
        const requests = await routeTokenPlaceSuccess(page);

        const chatPanel = await openChat(page, 'token-place');
        await sendChatMessage(chatPanel, 'Back to token place');
        await expect(chatPanel.getByText(ASSISTANT_REPLY)).toBeVisible();
        expect(requests).toHaveLength(1);
        expectSafeTokenPlaceRequest(requests[0]);
    });

    const errorCases = [
        {
            name: 'network fetch failure',
            type: 'network',
            text: /could not reach token\.place/i,
            handler: async (route: Route) => route.abort('failed'),
        },
        {
            name: 'content policy structured error',
            type: 'content_policy',
            text: /content policy/i,
            handler: async (route: Route) =>
                fulfillJson(route, 400, {
                    error: {
                        message: 'blocked',
                        type: 'content_policy_violation',
                        code: 'content_blocked',
                    },
                }),
        },
        {
            name: 'HTTP 429 rate limit',
            type: 'rate_limit',
            text: /rate limited|quota/i,
            handler: async (route: Route) =>
                fulfillJson(route, 429, { error: { message: 'slow down', type: 'rate_limit' } }),
        },
        {
            name: 'HTTP 5xx server unavailable',
            type: 'server',
            text: /unavailable|server/i,
            handler: async (route: Route) =>
                fulfillJson(route, 503, {
                    error: { message: 'unavailable', type: 'server_error' },
                }),
        },
        {
            name: 'malformed 200 provider response',
            type: 'malformed',
            text: /unexpected response/i,
            handler: async (route: Route) => fulfillJson(route, 200, { choices: [] }),
        },
    ];

    for (const errorCase of errorCases) {
        test(`shows token.place banner for ${errorCase.name}`, async ({ page }) => {
            await page.route(TOKEN_PLACE_URL, errorCase.handler);
            const chatPanel = await openChat(page, 'token-place');
            await sendChatMessage(chatPanel, `Trigger ${errorCase.name}`);
            const banner = chatPanel.locator('.chat-error');
            await expect(banner).toHaveAttribute('data-error-type', errorCase.type);
            await expect(banner).toContainText(errorCase.text);
        });
    }

    test('default token.place flow preserves persona switching and debug prompt ordering', async ({
        page,
    }) => {
        const requests = await routeTokenPlaceSuccess(page);
        await page.goto('/chat?debug=prompt');
        await waitForHydration(
            page,
            '[data-testid="chat-panel"][data-provider="token-place"][data-hydrated="true"]'
        );
        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="token-place"]');
        await chatPanel.locator('#chat-persona').selectOption('nova');
        await expect(chatPanel.locator('.persona-summary')).toContainText(
            /launch|rocket|checklist/i
        );

        await sendChatMessage(chatPanel, 'Show the debug payload for power planning');
        await expect(chatPanel.getByText(ASSISTANT_REPLY)).toBeVisible();
        await expect(page.getByTestId('chat-debug-panel')).toBeVisible();
        await expect(page.getByTestId('debug-provider-row')).toContainText('token-place');

        const debugTexts = await page
            .getByTestId('chat-debug-message')
            .locator('pre')
            .allTextContents();
        expect(debugTexts.length).toBeGreaterThanOrEqual(4);
        expect(debugTexts.join('\n')).toMatch(/system|persona|PlayerState|DSPACE/i);
        expect(debugTexts.join('\n')).toMatch(/docs|RAG|Knowledge/i);
        expect(debugTexts.at(-1)).toContain('Show the debug payload for power planning');
        expect(debugTexts.join('\n')).not.toMatch(STALE_PROVIDER_WORDING);
        expect(requests).toHaveLength(1);
        expectSafeTokenPlaceRequest(requests[0]);
    });
});
