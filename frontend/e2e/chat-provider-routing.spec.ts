import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

type CapturedRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
};

const tokenPlacePayload = (content = 'token.place assistant reply') => ({
    id: 'chatcmpl-e2e-token-place',
    object: 'chat.completion',
    created: 1780000000,
    model: 'gpt-5-chat-latest',
    choices: [{ message: { role: 'assistant', content } }],
    usage: { prompt_tokens: 8, completion_tokens: 5, total_tokens: 13 },
    metadata: { client: 'dspace', provider: 'token.place' },
});

async function routeTokenPlaceSuccess(page: Page, origin = 'https://token.place') {
    const requests: CapturedRequest[] = [];
    await page.route(`${origin}/api/v1/chat/completions`, async (route) => {
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
            body: JSON.stringify(tokenPlacePayload()),
        });
    });
    return requests;
}

async function blockLiveChatProviders(page: Page, allow: string[] = []) {
    await page.route(
        /https:\/\/(token\.place|staging\.token\.place|api\.openai\.com)\/.*/,
        async (route) => {
            const url = route.request().url();
            if (allow.some((allowed) => url.startsWith(allowed))) {
                await route.fallback();
                return;
            }
            await route.abort('blockedbyclient');
        }
    );
}

async function seedState(page: Page, state: Record<string, unknown>) {
    await page.addInitScript((value) => {
        localStorage.setItem('gameState', JSON.stringify(value));
    }, state);
}

async function openChat(page: Page, provider: 'token-place' | 'openai' = 'token-place') {
    await page.goto('/chat');
    await waitForHydration(page);
    const chatPanel = page.locator(`[data-testid="chat-panel"][data-provider="${provider}"]`);
    await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
    return chatPanel;
}

async function sendFromPanel(chatPanel: ReturnType<Page['locator']>, text: string) {
    await chatPanel.getByRole('textbox').fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
}

test.describe('Chat provider routing', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('fresh profile defaults to token.place API v1 without auth or OpenAI key UI', async ({
        page,
    }) => {
        const requests = await routeTokenPlaceSuccess(page);
        await blockLiveChatProviders(page, ['https://token.place/api/v1/chat/completions']);

        const chatPanel = await openChat(page, 'token-place');
        await expect(page.locator('[data-testid="chat-panel"]')).toHaveCount(1);
        await expect(page.getByLabel('OpenAI API key', { exact: true })).toHaveCount(0);
        await expect(page.getByText(/OpenAI API Key Settings/i)).toHaveCount(0);

        await sendFromPanel(chatPanel, 'Route my fresh profile through token.place');
        await expect(chatPanel.getByText('token.place assistant reply')).toBeVisible();

        expect(requests).toHaveLength(1);
        const request = requests[0];
        expect(request.method).toBe('POST');
        expect(request.url).toBe('https://token.place/api/v1/chat/completions');
        expect(request.url).toMatch(/\/api\/v1\/chat\/completions$/);
        expect(request.headers.authorization).toBeUndefined();
        expect(request.body.model).toBeTruthy();
        expect(Array.isArray(request.body.messages)).toBe(true);
        expect(request.body.stream).not.toBe(true);
        expect(request.body.metadata).toEqual({ client: 'dspace', provider: 'token.place' });
        const serializedBody = JSON.stringify(request.body);
        expect(serializedBody).not.toMatch(/apiKey|sk-/i);
        expect(serializedBody).not.toMatch(/raw save|inventory details/i);
        expect(JSON.stringify(request.headers)).not.toMatch(/authorization|apiKey|sk-/i);
    });

    test('default runtime token.place base URL overrides stale saved staging URL', async ({
        page,
    }) => {
        await seedState(page, {
            settings: { chatProvider: 'token-place' },
            tokenPlace: { url: 'https://staging.token.place/api' },
        });
        const requests = await routeTokenPlaceSuccess(page);
        await blockLiveChatProviders(page, ['https://token.place/api/v1/chat/completions']);

        const chatPanel = await openChat(page, 'token-place');
        await sendFromPanel(chatPanel, 'Use runtime token.place');
        await expect(chatPanel.getByText('token.place assistant reply')).toBeVisible();

        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe('https://token.place/api/v1/chat/completions');
        expect(requests[0].url).not.toContain('/api/api/v1/chat/completions');
    });

    test('provider preference persists after selecting OpenAI and saving a fake key', async ({
        page,
    }) => {
        await page.goto('/settings');
        await waitForHydration(page);
        await page.locator('input[name="chat-provider"][value="openai"]').check();
        await page.getByLabel('OpenAI API key', { exact: true }).fill('sk-fake-e2e-openai-key');
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
        await expect(page.getByTestId('openai-key-status')).toHaveText(
            'OpenAI API key configured.'
        );

        await page.reload();
        await waitForHydration(page);
        await expect(page.locator('input[name="chat-provider"][value="openai"]')).toBeChecked();

        const chatPanel = await openChat(page, 'openai');
        await expect(chatPanel).toHaveAttribute('data-provider', 'openai');
    });

    test('OpenAI is optional and gated when selected without a key', async ({ page }) => {
        let tokenPlaceCalls = 0;
        let openAiCalls = 0;
        await page.route('https://token.place/api/v1/chat/completions', async (route) => {
            tokenPlaceCalls += 1;
            await route.abort();
        });
        await page.route('https://api.openai.com/**', async (route) => {
            openAiCalls += 1;
            await route.abort();
        });

        await page.goto('/settings');
        await waitForHydration(page);
        await page.locator('input[name="chat-provider"][value="openai"]').check();
        await expect(page.getByRole('status')).toHaveText('Chat provider saved: OpenAI.');
        await expect(page.getByLabel('OpenAI API key', { exact: true })).toBeVisible();
        await expect
            .poll(async () =>
                page.evaluate(() => {
                    const state = JSON.parse(localStorage.getItem('gameState') || '{}');
                    return {
                        apiKey: state.openAI?.apiKey ?? '',
                        chatProvider: state.settings?.chatProvider,
                    };
                })
            )
            .toEqual({ apiKey: '', chatProvider: 'openai' });

        const chatPanel = await openChat(page, 'openai');
        await expect(chatPanel).toHaveAttribute('data-provider', 'openai');
        await sendFromPanel(chatPanel, 'OpenAI should be gated');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'missing-key');
        await expect(banner).toContainText(/OpenAI requires an API key/i);
        await expect(banner.getByRole('link', { name: 'Open Settings' })).toHaveAttribute(
            'href',
            '/settings'
        );
        expect(tokenPlaceCalls).toBe(0);
        expect(openAiCalls).toBe(0);
    });

    test('switching back to token.place clears OpenAI routing and sends through token.place', async ({
        page,
    }) => {
        await seedState(page, {
            settings: { chatProvider: 'openai' },
            openAI: { apiKey: 'sk-fake-e2e-openai-key' },
        });
        const requests = await routeTokenPlaceSuccess(page);
        await blockLiveChatProviders(page, ['https://token.place/api/v1/chat/completions']);

        await page.goto('/settings');
        await waitForHydration(page);
        await page.getByRole('button', { name: 'Clear API key' }).click();
        await page.locator('input[name="chat-provider"][value="token-place"]').check();
        await expect(page.getByRole('status')).toHaveText('Chat provider saved: token.place.');
        await expect
            .poll(async () =>
                page.evaluate(() => {
                    const state = JSON.parse(localStorage.getItem('gameState') || '{}');
                    return state.settings?.chatProvider;
                })
            )
            .toBe('token-place');

        const chatPanel = await openChat(page, 'token-place');
        await sendFromPanel(chatPanel, 'Back to default provider');
        await expect(chatPanel.getByText('token.place assistant reply')).toBeVisible();
        expect(requests).toHaveLength(1);
    });

    test('default token.place flow supports persona switching and debug/RAG payload ordering', async ({
        page,
    }) => {
        const requests = await routeTokenPlaceSuccess(page);
        await blockLiveChatProviders(page, ['https://token.place/api/v1/chat/completions']);
        await seedState(page, {
            settings: { chatProvider: 'token-place', showChatDebugPayload: true },
        });

        const chatPanel = await openChat(page, 'token-place');
        const personaSelect = chatPanel.locator('#chat-persona');
        const options = await personaSelect.locator('option').evaluateAll((nodes) =>
            nodes.map((node) => ({
                value: node.getAttribute('value') || '',
                text: node.textContent || '',
            }))
        );
        expect(options.length).toBeGreaterThan(1);
        await personaSelect.selectOption(options[1].value);
        await expect(personaSelect).toHaveValue(options[1].value);

        await sendFromPanel(chatPanel, 'Show the debug payload with RAG context');
        await expect(chatPanel.getByText('token.place assistant reply')).toBeVisible();
        expect(requests).toHaveLength(1);
        await expect(page.getByTestId('debug-provider-row')).toContainText('token-place');
        await page.getByRole('button', { name: 'Show prompt' }).click();
        await expect(page.getByRole('button', { name: 'Hide prompt' })).toBeVisible();

        const debugMessages = page.getByTestId('chat-debug-message');
        await expect(debugMessages.first()).toBeVisible();
        const debugText = await debugMessages.allTextContents();
        expect(debugText.join('\n')).toMatch(/system|persona|PlayerState|RAG/i);
        expect(debugText.at(-1)).toContain('Show the debug payload with RAG context');
        expect(debugText.join('\n')).not.toMatch(
            /token\.place is deferred|chat uses OpenAI|OpenAI-only/i
        );
        expect(JSON.stringify(requests[0].body)).not.toMatch(
            /token\.place is deferred|chat uses OpenAI|OpenAI-only/i
        );
    });
});
