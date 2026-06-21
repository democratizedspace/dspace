import { webcrypto } from 'node:crypto';

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
    model: 'llama-3.1-8b-instruct',
    choices: [{ message: { role: 'assistant', content } }],
    usage: { prompt_tokens: 8, completion_tokens: 5, total_tokens: 13 },
    metadata: { client: 'dspace', provider: 'token.place' },
});

const bytesToBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const pemToDerBase64 = (pem: string) =>
    pem
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '');
const wrapPem = (base64Der: string) =>
    `-----BEGIN PUBLIC KEY-----\n${base64Der.match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;

async function exportPublicKeyPem(publicKey: CryptoKey) {
    const der = await webcrypto.subtle.exportKey('spki', publicKey);
    return wrapPem(Buffer.from(der).toString('base64'));
}

async function encryptForClient(envelope: Record<string, unknown>, clientPublicKeyBase64: string) {
    const clientPem = Buffer.from(clientPublicKeyBase64, 'base64').toString('utf8');
    const publicKey = await webcrypto.subtle.importKey(
        'spki',
        Buffer.from(pemToDerBase64(clientPem), 'base64'),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
    const aesKey = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
    ]);
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        new TextEncoder().encode(JSON.stringify(envelope))
    );
    const rawKey = await webcrypto.subtle.exportKey('raw', aesKey);
    const cipherkey = await webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawKey);
    return {
        ciphertext: Buffer.from(ciphertext).toString('base64'),
        cipherkey: Buffer.from(cipherkey).toString('base64'),
        iv: bytesToBase64(iv),
    };
}

async function routeTokenPlaceSuccess(page: Page, origin = 'https://token.place') {
    const requests: CapturedRequest[] = [];
    const serverKeys = await webcrypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
        },
        true,
        ['encrypt', 'decrypt']
    );
    const serverPublicKeyPem = await exportPublicKeyPem(serverKeys.publicKey);
    const serverPublicKeyBase64 = Buffer.from(serverPublicKeyPem).toString('base64');

    await page.route(`${origin}/api/v1/relay/servers/next`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ server_public_key: serverPublicKeyBase64 }),
        });
    });
    await page.route(`${origin}/api/v1/relay/requests`, async (route) => {
        const request = route.request();
        requests.push({
            method: request.method(),
            url: request.url(),
            headers: request.headers(),
            body: JSON.parse(request.postData() || '{}'),
        });
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.route(`${origin}/api/v1/relay/responses/retrieve`, async (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        const encrypted = await encryptForClient(
            {
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                request_id: body.request_id,
                client_public_key: body.client_public_key,
                api_v1_response: tokenPlacePayload(),
            },
            body.client_public_key
        );
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(encrypted),
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
        await blockLiveChatProviders(page, ['https://token.place/api/v1/relay/']);

        const chatPanel = await openChat(page, 'token-place');
        await expect(page.locator('[data-testid="chat-panel"]')).toHaveCount(1);
        await expect(page.getByLabel('OpenAI API key', { exact: true })).toHaveCount(0);
        await expect(page.getByText(/OpenAI API Key Settings/i)).toHaveCount(0);

        await sendFromPanel(chatPanel, 'Route my fresh profile through token.place');
        await expect(chatPanel.getByText('token.place assistant reply')).toBeVisible();

        expect(requests).toHaveLength(1);
        const request = requests[0];
        expect(request.method).toBe('POST');
        expect(request.url).toBe('https://token.place/api/v1/relay/requests');
        expect(request.url).toMatch(/\/api\/v1\/relay\/requests$/);
        expect(request.headers.authorization).toBeUndefined();
        expect(request.body).toEqual(
            expect.objectContaining({
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                request_id: expect.any(String),
                client_public_key: expect.any(String),
                server_public_key: expect.any(String),
                ciphertext: expect.any(String),
                cipherkey: expect.any(String),
                iv: expect.any(String),
                cancel_token: expect.any(String),
            })
        );
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
        await blockLiveChatProviders(page, ['https://token.place/api/v1/relay/']);

        const chatPanel = await openChat(page, 'token-place');
        await sendFromPanel(chatPanel, 'Use runtime token.place');
        await expect(chatPanel.getByText('token.place assistant reply')).toBeVisible();

        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe('https://token.place/api/v1/relay/requests');
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
        await blockLiveChatProviders(page, ['https://token.place/api/v1/relay/']);

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
        await blockLiveChatProviders(page, ['https://token.place/api/v1/relay/']);
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
            /token\.place is deferred|chat uses OpenAI|OpenAI-only|Show the debug payload/i
        );
    });
});
