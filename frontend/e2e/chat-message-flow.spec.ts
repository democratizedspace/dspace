import { webcrypto } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import { clearUserData, seedOpenAIChatState, waitForHydration } from './test-helpers';

const LONG_REPLY =
    'This is a long assistant response that should render in the chat history without breaking the layout or truncating text, even when it spans multiple sentences and needs wrapping across several lines for readability.';
const FALLBACK_MESSAGE = "Sorry, I'm having some trouble and can't generate a response.";
const NETWORK_ERROR_MESSAGE = /could not reach openai/i;
const RATE_LIMIT_MESSAGE = /openai rate limited/i;
const QUOTA_MESSAGE = /out of credits/i;
const AUTH_MESSAGE = /api key/i;
const PERMISSION_MESSAGE = /denied access/i;
const SERVER_MESSAGE = /unavailable right now/i;

const encoder = new TextEncoder();
const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array) =>
    Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString('base64');
const base64ToBytes = (value: string) => Uint8Array.from(Buffer.from(value, 'base64'));
const base64ToPem = (base64: string) =>
    `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;
const pemToBase64 = (pem: string) =>
    pem.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/g, '');

async function generateRelayKeypair() {
    const pair = await webcrypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
    const spki = await webcrypto.subtle.exportKey('spki', pair.publicKey);
    const publicPem = base64ToPem(bytesToBase64(spki));
    return { publicKeyBase64: bytesToBase64(encoder.encode(publicPem)) };
}

async function encryptRelayEnvelope(
    envelope: Record<string, unknown>,
    clientPublicKeyBase64: string
) {
    const aesKey = await webcrypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const rawAesKey = await webcrypto.subtle.exportKey('raw', aesKey);
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        aesKey,
        encoder.encode(JSON.stringify(envelope))
    );
    const clientPublicPem = Buffer.from(clientPublicKeyBase64, 'base64').toString('utf8');
    const publicKey = await webcrypto.subtle.importKey(
        'spki',
        base64ToBytes(pemToBase64(clientPublicPem)),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
    );
    const cipherkey = await webcrypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        encoder.encode(bytesToBase64(rawAesKey))
    );
    return {
        chat_history: bytesToBase64(ciphertext),
        ciphertext: bytesToBase64(ciphertext),
        cipherkey: bytesToBase64(cipherkey),
        iv: bytesToBase64(iv),
    };
}

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
        await seedOpenAIChatState(page);
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

test.describe('Chat provider routing', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('OpenAI opt-in without a saved key shows settings guidance without making an OpenAI request', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            localStorage.setItem(
                'gameState',
                JSON.stringify({ settings: { chatProvider: 'openai' }, openAI: { apiKey: '' } })
            );
            // @ts-expect-error test hook for OpenAI client
            window.__openAIRequests = 0;
            // @ts-expect-error test hook for OpenAI client
            window.__DSpaceOpenAIClient = function () {
                // @ts-expect-error test hook for OpenAI client
                window.__openAIRequests += 1;
                return {
                    responses: {
                        create: async () => ({ output_text: 'unexpected OpenAI reply' }),
                    },
                };
            };
        });

        await page.goto('/chat');
        await waitForHydration(page);

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
        await chatPanel.getByRole('textbox').fill('Try OpenAI without a saved key');
        await chatPanel.getByRole('button', { name: 'Send' }).click();

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'missing-key');
        await expect(banner).toContainText(/OpenAI requires an API key/i);
        await expect(banner.getByRole('link', { name: 'Open Settings' })).toHaveAttribute(
            'href',
            '/settings'
        );
        await expect(chatPanel.getByText(/Add your key on \/settings/i)).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.__openAIRequests)).toBe(0);
    });

    test('default token.place path sends shared prompt payload without OpenAI secrets or legacy endpoints', async ({
        page,
    }) => {
        const tokenPlaceRequests: Array<{
            url: string;
            body: Record<string, unknown>;
            headers: Record<string, string>;
        }> = [];
        const legacyRequests: string[] = [];
        const serverKey = await generateRelayKeypair();
        await page.route('https://token.place/api/v1/relay/servers/next', async (route) => {
            const request = route.request();
            tokenPlaceRequests.push({
                url: request.url(),
                body: {},
                headers: request.headers(),
            });
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ server_public_key: serverKey.publicKeyBase64 }),
            });
        });
        await page.route('https://token.place/api/v1/relay/requests', async (route) => {
            const request = route.request();
            tokenPlaceRequests.push({
                url: request.url(),
                body: JSON.parse(request.postData() || '{}'),
                headers: request.headers(),
            });
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ accepted: true }),
            });
        });
        await page.route('https://token.place/api/v1/relay/responses/retrieve', async (route) => {
            const request = route.request();
            const body = JSON.parse(request.postData() || '{}');
            tokenPlaceRequests.push({
                url: request.url(),
                body,
                headers: request.headers(),
            });
            const encrypted = await encryptRelayEnvelope(
                {
                    protocol: 'tokenplace_api_v1_relay_e2ee',
                    version: 1,
                    request_id: body.request_id,
                    client_public_key: body.client_public_key,
                    api_v1_response: {
                        choices: [{ message: { content: 'token.place grounded reply' } }],
                        contextSources: [
                            { type: 'provider', label: 'provider source should not show' },
                        ],
                        usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 },
                        metadata: { request_id: 'tp-123', provider: 'token.place' },
                    },
                },
                String(body.client_public_key)
            );
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(encrypted),
            });
        });
        await page.route('https://token.place/api/v1/chat/completions', async (route) => {
            legacyRequests.push(route.request().url());
            await route.abort();
        });
        await page.route(/\/api\/chat$|\/chat$/, async (route) => {
            const request = route.request();
            if (request.isNavigationRequest()) {
                await route.continue();
                return;
            }
            legacyRequests.push(request.url());
            await route.abort();
        });

        await page.goto('/chat');
        await waitForHydration(page);

        const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="token-place"]');
        await expect(chatPanel).toHaveAttribute('data-hydrated', 'true');
        await chatPanel.getByRole('textbox').fill('How do DSPACE routes work?');
        await chatPanel.getByRole('button', { name: 'Send' }).click();

        await expect(chatPanel.getByText('token.place grounded reply')).toBeVisible();
        expect(tokenPlaceRequests.map((request) => request.url)).toEqual([
            'https://token.place/api/v1/relay/servers/next',
            'https://token.place/api/v1/relay/requests',
            'https://token.place/api/v1/relay/responses/retrieve',
        ]);
        expect(legacyRequests).toEqual([]);
        const { body, headers } = tokenPlaceRequests[1];
        expect(headers.authorization).toBeUndefined();
        expect(body).toEqual(
            expect.objectContaining({
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                client_public_key: expect.any(String),
                ciphertext: expect.any(String),
                cipherkey: expect.any(String),
                iv: expect.any(String),
                cancel_token: expect.any(String),
            })
        );
        const serializedBody = JSON.stringify(body);
        expect(serializedBody).not.toContain('apiKey');
        expect(serializedBody).not.toContain('openAI');
        expect(serializedBody).not.toContain('How do DSPACE routes work?');

        const sources = chatPanel.getByTestId('sources-used');
        await expect(sources).toBeVisible();
        await expect(sources).toContainText(/docs|route|changelog/i);
        await expect(sources).not.toContainText('provider source should not show');
    });
});
