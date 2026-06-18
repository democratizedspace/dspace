import { expect, test, type Page, type Request } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const TOKEN_PLACE_URL = 'https://token.place/api/v1/chat/completions';
const STAGING_TOKEN_PLACE_URL = 'https://staging.token.place/api/v1/chat/completions';
const FAKE_OPENAI_KEY = 'sk-test-openai-provider-routing-fake-key';
const STALE_PROVIDER_COPY = /token\.place is deferred|In v3, chat uses OpenAI|chat uses OpenAI/i;

type CapturedRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
};

async function seedGameState(page: Page, state: Record<string, unknown>) {
    await page.addInitScript((seed) => {
        localStorage.setItem('gameState', JSON.stringify(seed));
    }, state);
}

async function interceptTokenPlace(
    page: Page,
    url = TOKEN_PLACE_URL,
    responseText = 'token.place assistant response'
) {
    const captured: CapturedRequest[] = [];
    await page.route(url, async (route) => {
        const request = route.request();
        captured.push(captureRequest(request));
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'chatcmpl-e2e',
                object: 'chat.completion',
                created: 1_800_000_000,
                model: 'gpt-5-chat-latest',
                choices: [
                    {
                        index: 0,
                        message: { role: 'assistant', content: responseText },
                        finish_reason: 'stop',
                    },
                ],
                usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
                metadata: { client: 'dspace', provider: 'token.place' },
            }),
        });
    });
    return captured;
}

function captureRequest(request: Request): CapturedRequest {
    const raw = request.postData() || '{}';
    return {
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        body: JSON.parse(raw),
    };
}

async function openChat(page: Page) {
    await page.goto('/chat');
    await waitForHydration(page);
    const chatPanel = page.getByTestId('chat-panel');
    await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
    return chatPanel;
}

async function sendChatMessage(page: Page, text: string) {
    const chatPanel = page.getByTestId('chat-panel');
    await chatPanel.getByRole('textbox').fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
    await expect(chatPanel.getByText(text)).toBeVisible();
    return chatPanel;
}

async function selectProvider(page: Page, provider: 'openai' | 'token-place') {
    await page.goto('/settings');
    await waitForHydration(page);
    await page.locator(`input[name="chat-provider"][value="${provider}"]`).check();
    await expect(page.locator(`input[name="chat-provider"][value="${provider}"]`)).toBeChecked();
}

test.describe('Chat provider routing', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('fresh profile defaults to zero-auth token.place API v1', async ({ page }) => {
        const captured = await interceptTokenPlace(page);

        const chatPanel = await openChat(page);
        await expect(chatPanel).toHaveAttribute('data-provider', 'token-place');
        await expect(page.getByLabel('OpenAI API key', { exact: true })).toHaveCount(0);

        await sendChatMessage(page, 'Hello token.place default');
        await expect(chatPanel.getByText('token.place assistant response')).toBeVisible();
        expect(captured).toHaveLength(1);

        const request = captured[0];
        expect(request.method).toBe('POST');
        expect(request.url).toBe(TOKEN_PLACE_URL);
        expect(request.headers.authorization).toBeUndefined();
        expect(request.body).toHaveProperty('model');
        expect(request.body).toHaveProperty('messages');
        expect(request.body).not.toHaveProperty('stream', true);
        expect(request.body.metadata).toEqual({ client: 'dspace', provider: 'token.place' });
        expect(JSON.stringify(request.body)).not.toMatch(
            /sk-|apiKey|credential|raw save|playerSave/i
        );
    });

    test('staging token.place base URL can be used through saved state override', async ({
        page,
    }) => {
        await seedGameState(page, {
            tokenPlace: { url: 'https://staging.token.place/api' },
            settings: { chatProvider: 'token-place' },
            quests: {},
            inventory: {},
            processes: {},
            versionNumberString: '3',
        });
        const captured = await interceptTokenPlace(
            page,
            STAGING_TOKEN_PLACE_URL,
            'staging token.place response'
        );
        let productionHits = 0;
        await page.route(TOKEN_PLACE_URL, async (route) => {
            productionHits += 1;
            await route.abort();
        });

        const chatPanel = await openChat(page);
        await sendChatMessage(page, 'Use staging token.place');
        await expect(chatPanel.getByText('staging token.place response')).toBeVisible();

        expect(captured).toHaveLength(1);
        expect(captured[0].url).toBe(STAGING_TOKEN_PLACE_URL);
        expect(productionHits).toBe(0);
    });

    test('provider preference persists and OpenAI is selected only from settings', async ({
        page,
    }) => {
        await selectProvider(page, 'openai');
        await page.getByLabel('OpenAI API key', { exact: true }).fill(FAKE_OPENAI_KEY);
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
        await expect(page.getByTestId('openai-key-status')).toHaveText(
            'OpenAI API key configured.'
        );

        await page.reload();
        await waitForHydration(page);
        await expect(page.locator('input[name="chat-provider"][value="openai"]')).toBeChecked();

        const chatPanel = await openChat(page);
        await expect(chatPanel).toHaveAttribute('data-provider', 'openai');
    });

    test('OpenAI opt-in without a key is gated and makes no provider request', async ({ page }) => {
        await selectProvider(page, 'openai');
        let providerCalls = 0;
        await page.route(/token\.place|api\.openai\.com/, async (route) => {
            providerCalls += 1;
            await route.abort();
        });

        const chatPanel = await openChat(page);
        await expect(chatPanel).toHaveAttribute('data-provider', 'openai');
        await sendChatMessage(page, 'Do not send without a key');
        await expect(chatPanel.locator('.chat-error')).toHaveAttribute(
            'data-error-type',
            'missing-key'
        );
        await expect(chatPanel.locator('.chat-error')).toContainText(/OpenAI requires an API key/i);
        expect(providerCalls).toBe(0);
    });

    test('switching back to token.place restores no-auth token.place routing', async ({ page }) => {
        await selectProvider(page, 'openai');
        await page.getByLabel('OpenAI API key', { exact: true }).fill(FAKE_OPENAI_KEY);
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
        await page.getByRole('button', { name: 'Clear API key' }).click();
        await page.locator('input[name="chat-provider"][value="token-place"]').check();
        await expect(
            page.locator('input[name="chat-provider"][value="token-place"]')
        ).toBeChecked();

        const captured = await interceptTokenPlace(page, TOKEN_PLACE_URL, 'back on token.place');
        const chatPanel = await openChat(page);
        await expect(chatPanel).toHaveAttribute('data-provider', 'token-place');
        await sendChatMessage(page, 'Back to token.place');
        await expect(chatPanel.getByText('back on token.place')).toBeVisible();
        expect(captured).toHaveLength(1);
    });

    test('persona switching and debug payload stay provider-aware on token.place', async ({
        page,
    }) => {
        await seedGameState(page, {
            settings: { chatProvider: 'token-place', showChatDebugPayload: true },
            quests: {},
            inventory: {},
            processes: {},
            versionNumberString: '3',
        });
        const captured = await interceptTokenPlace(page, TOKEN_PLACE_URL, 'debug persona response');

        const chatPanel = await openChat(page);
        const personaSelect = chatPanel.locator('#chat-persona');
        await personaSelect.selectOption({ index: 1 });
        await sendChatMessage(page, 'Show debug payload with RAG context');
        await expect(chatPanel.getByText('debug persona response')).toBeVisible();

        const debugPanel = page.getByTestId('chat-debug-panel');
        await expect(debugPanel).toBeVisible();
        await expect(debugPanel).toContainText(/system/i);
        await expect(debugPanel).toContainText(/user/i);

        const serializedDebug = await debugPanel.textContent();
        expect(serializedDebug || '').not.toMatch(STALE_PROVIDER_COPY);
        expect(JSON.stringify(captured[0].body.messages)).not.toMatch(STALE_PROVIDER_COPY);

        const messages = captured[0].body.messages as Array<{ role: string; content: string }>;
        expect(messages[0].role).toBe('system');
        expect(messages.at(-1)?.role).toBe('user');
        expect(
            messages
                .slice(0, -1)
                .map((message) => message.content)
                .join('\n')
        ).toMatch(/persona|player|DSPACE|docs|context/i);
    });
});
