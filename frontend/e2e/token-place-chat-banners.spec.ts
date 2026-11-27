import { constants, publicEncrypt, webcrypto } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

type TokenPlaceStubMode =
    | 'success'
    | 'network-error'
    | 'content-policy'
    | 'rate-limit'
    | 'server-error'
    | 'malformed'
    | 'provider-error'
    | 'unexpected-http-error';

const encoder = new TextEncoder();
const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array) =>
    Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString('base64');
const base64ToPem = (base64: string) =>
    `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;

const RECOVERY_REPLY = 'The relay responded after recovery.';

const relayResponse = (mode: TokenPlaceStubMode) => {
    if (mode === 'success') {
        return { choices: [{ message: { role: 'assistant', content: RECOVERY_REPLY } }] };
    }

    if (mode === 'content-policy') {
        return {
            status: 400,
            error: {
                message: 'Content blocked',
                type: 'content_policy_violation',
                code: 'content_blocked',
            },
        };
    }

    if (mode === 'rate-limit') {
        return { status: 429, error: { message: 'Slow down', type: 'rate_limit' } };
    }

    if (mode === 'server-error') {
        return { status: 503, error: { message: 'Unavailable', type: 'server_error' } };
    }

    if (mode === 'provider-error') {
        return { status: 400, error: { message: 'Provider down' } };
    }

    if (mode === 'unexpected-http-error') {
        return { status: 418, error: { message: 'Unexpected token.place failure' } };
    }

    return { choices: [{ message: { role: 'assistant', content: '' } }] };
};

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
    const cipherkey = bytesToBase64(
        publicEncrypt(
            { key: clientPublicPem, padding: constants.RSA_PKCS1_PADDING },
            Buffer.from(bytesToBase64(rawAesKey), 'utf8')
        )
    );
    const encodedCiphertext = bytesToBase64(ciphertext);
    return {
        chat_history: encodedCiphertext,
        ciphertext: encodedCiphertext,
        cipherkey,
        iv: bytesToBase64(iv),
    };
}

const installTokenPlaceStub = async (
    page: Page,
    initialMode: TokenPlaceStubMode,
    completion?: () => Promise<{ response: Record<string, unknown>; relayUsage?: unknown }>
) => {
    let mode = initialMode;
    const serverKey = await generateRelayKeypair();

    await page.route('https://token.place/api/v1/relay/servers/next**', async (route) => {
        if (mode === 'network-error') {
            await route.abort('failed');
            return;
        }

        const requestedTier =
            new URL(route.request().url()).searchParams.get('context_tier') || '8k-fast';
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                server_public_key: serverKey.publicKeyBase64,
                context_tier: requestedTier,
                selected_profile_id: `e2e-${requestedTier}`,
                selected_model_support: ['qwen3-8b-instruct'],
            }),
        });
    });

    await page.route('https://token.place/api/v1/relay/requests', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ accepted: true, retrieval_credential: 'e2e-retrieval-proof' }),
        });
    });

    await page.route('https://token.place/api/v1/relay/responses/retrieve', async (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        expect(body.retrieval_credential).toBe('e2e-retrieval-proof');
        if (body.acknowledgement_token) {
            expect(body.acknowledgement_token).toBe('e2e-acknowledgement-proof');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'acknowledged' }),
            });
            return;
        }
        const { response, relayUsage } = completion
            ? await completion()
            : { response: relayResponse(mode), relayUsage: undefined };
        const encrypted = await encryptRelayEnvelope(
            {
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                request_id: body.request_id,
                client_public_key: body.client_public_key,
                api_v1_response: response,
            },
            body.client_public_key
        );
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ...encrypted,
                ...(relayUsage === undefined ? {} : { usage: relayUsage }),
                acknowledgement_token: 'e2e-acknowledgement-proof',
            }),
        });
    });

    await page.route('https://token.place/api/v1/chat/completions', async (route) => {
        await route.abort('blockedbyclient');
        throw new Error(`Unexpected legacy token.place request: ${route.request().url()}`);
    });
    return () => {
        mode = 'success';
    };
};

const seedTokenPlaceDefaultState = async (page: Page, tokenPlaceTokenLite = false) => {
    await page.addInitScript((tokenLite) => {
        const state = {
            tokenPlace: { enabled: false },
            quests: {},
            inventory: {},
            processes: {},
            settings: { chatProvider: 'token-place', tokenPlaceTokenLite: tokenLite },
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        };
        localStorage.setItem('gameState', JSON.stringify(state));
    }, tokenPlaceTokenLite);
};

const openTokenPlacePanel = async (page: Page) => {
    await page.goto('/chat');
    await waitForHydration(page);

    const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="token-place"]');
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
    const { chatPanel, spinner, messageBox } = await openTokenPlacePanel(page);
    await messageBox.fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
    await expect(chatPanel.getByText(text)).toBeVisible();

    return { chatPanel, spinner };
};

test.describe('Token.place chat error banners', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(/^https?:\/\/(?:[^/]+\.)?(?:token\.place|openai\.com)(?:\/|$)/, (route) =>
            route.abort('blockedbyclient')
        );
        await clearUserData(page);
    });

    async function expectSuccessfulRetry(chatPanel: ReturnType<Page['locator']>) {
        await chatPanel.getByRole('textbox').fill('Try again after the relay failure');
        await chatPanel.getByRole('button', { name: 'Send' }).click();
        await expect(
            chatPanel
                .locator('.message-bubble.assistant')
                .getByText(RECOVERY_REPLY, { exact: true })
        ).toBeVisible();
        await expect(chatPanel.getByRole('alert')).toHaveCount(0);
        await expect(chatPanel.locator('.spinner-container')).not.toBeVisible();
    }

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

    const upstreamDiagnostic = 'private-provider-diagnostic-e2e';
    const httpFailures = [
        {
            status: 400,
            type: 'content_policy',
            message: /blocked that request by policy/i,
            error: { code: 'content_blocked', message: upstreamDiagnostic },
        },
        {
            status: 429,
            type: 'rate_limit',
            message: /rate limited or out of daily quota/i,
            error: { message: upstreamDiagnostic },
        },
        {
            status: 503,
            type: 'server',
            message: /temporarily unavailable/i,
            error: { message: upstreamDiagnostic },
        },
    ];

    for (const { status, type, message, error } of httpFailures) {
        test(`handles a relay HTTP ${status} without exposing the upstream diagnostic`, async ({
            page,
        }) => {
            await installTokenPlaceStub(page, 'success');
            await seedTokenPlaceDefaultState(page);
            let dispatches = 0;
            await page.route('https://token.place/api/v1/relay/requests', async (route) => {
                dispatches += 1;
                if (dispatches === 1) await route.fulfill({ status, json: { error } });
                else await route.fallback();
            });

            const { chatPanel, spinner } = await sendMessage(
                page,
                `Check relay response ${status}`
            );
            const banner = chatPanel.getByRole('alert');
            await expect(banner).toHaveAttribute('data-error-type', type);
            await expect(banner).toContainText(message);
            await expect(chatPanel).not.toContainText(upstreamDiagnostic);
            await expect(spinner).not.toBeVisible();
            expect(dispatches).toBe(1);
            await expectSuccessfulRetry(chatPanel);
            expect(dispatches).toBe(2);
        });
    }

    test('recovers when the token.place relay fetch is aborted', async ({ page }) => {
        await installTokenPlaceStub(page, 'success');
        await page.addInitScript(() => {
            let canceled = false;
            const fetch = window.fetch.bind(window);
            window.fetch = (input, init) => {
                const url = new URL(
                    typeof input === 'string' || input instanceof URL ? input : input.url,
                    window.location.origin
                );
                if (
                    !canceled &&
                    url.origin === 'https://token.place' &&
                    url.pathname === '/api/v1/relay/servers/next'
                ) {
                    canceled = true;
                    return Promise.reject(new DOMException('Fixture cancellation', 'AbortError'));
                }
                return fetch(input, init);
            };
        });
        await seedTokenPlaceDefaultState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Check canceled relay request');
        const banner = chatPanel.getByRole('alert');
        await expect(banner).toHaveAttribute('data-error-type', 'abort');
        await expect(banner).toContainText(/request was canceled.*try again/i);
        await expect(chatPanel).not.toContainText('Fixture cancellation');
        await expect(spinner).not.toBeVisible();
        await expectSuccessfulRetry(chatPanel);
    });

    for (const { name, mode, type, message } of cases) {
        test(name, async ({ page }) => {
            const restoreRelay = await installTokenPlaceStub(page, mode);
            await seedTokenPlaceDefaultState(page);

            const { chatPanel, spinner } = await sendMessage(page, `Trigger ${mode}`);

            const banner = chatPanel.locator('.chat-error');
            await expect(banner).toHaveAttribute('data-error-type', type);
            await expect(banner).toContainText(message);
            await expect(banner).not.toContainText(/OpenAI/i);
            await expect(spinner).not.toBeVisible();
            restoreRelay();
            await expectSuccessfulRetry(chatPanel);
        });
    }
});

test('waits for the complete relay reply and shows only decrypted usage', async ({
    page,
    context,
    baseURL,
}) => {
    if (!baseURL) throw new Error('Expected an isolated local Playwright web server');
    const appOrigin = new URL(baseURL);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(appOrigin.hostname)) {
        throw new Error('The completion evidence test must run against loopback only');
    }
    await context.route('**/*', (route) =>
        new URL(route.request().url()).origin === appOrigin.origin
            ? route.continue()
            : route.abort('blockedbyclient')
    );
    await clearUserData(page);
    await seedTokenPlaceDefaultState(page, true);

    let allowFirstReply: () => void = () => {};
    const heldReply = new Promise<void>((resolve) => {
        allowFirstReply = resolve;
    });
    const decryptedUsage = { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 };
    const untrustedRelayUsage = { prompt_tokens: 400, completion_tokens: 100, total_tokens: 500 };
    const baselineReply = 'Complete fixture answer with usage.';
    const followupReply = 'Followup fixture answer without usage.';
    let completions = 0;
    await installTokenPlaceStub(page, 'success', async () => {
        const first = ++completions === 1;
        if (first) await heldReply;
        return {
            response: {
                choices: [
                    {
                        message: {
                            role: 'assistant',
                            content: first ? baselineReply : followupReply,
                        },
                    },
                ],
                ...(first ? { usage: decryptedUsage } : {}),
            },
            relayUsage: untrustedRelayUsage,
        };
    });
    await page.goto('/chat#prompt-debug');
    const panel = page.getByTestId('chat-panel');
    await expect(panel).toHaveAttribute('data-hydrated', 'true');
    await expect(panel).toHaveAttribute('data-provider', 'token-place');
    const debug = panel.getByTestId('chat-debug-panel');
    await expect(debug).toBeVisible();
    const usage = debug.getByText('Provider usage', { exact: true });
    const spinner = panel.locator('.spinner-container');
    const waiting = panel.getByRole('status');
    const composer = panel.getByRole('textbox', { name: 'Chat message' });
    const send = panel.getByRole('button', { name: 'Send', exact: true });
    const firstAnswer = panel
        .locator('.message-bubble.assistant')
        .filter({ hasText: baselineReply });
    const followupAnswer = panel
        .locator('.message-bubble.assistant')
        .filter({ hasText: followupReply });

    await expect(usage).toHaveCount(0);
    await expect(spinner).not.toBeVisible();
    await expect(waiting).toBeEmpty();
    await composer.fill('A held synthetic fixture prompt');
    try {
        await send.click();
        await expect.poll(() => completions).toBe(1);
        await expect(spinner).toBeVisible();
        await expect(waiting).toHaveText('Waiting for a reply…');
        await expect(panel.getByRole('alert')).toHaveCount(0);
        await expect(firstAnswer).toHaveCount(0);
        await expect(usage).toHaveCount(0);
    } finally {
        allowFirstReply();
    }

    await expect(firstAnswer).toBeVisible();
    await expect(spinner).not.toBeVisible();
    await expect(waiting).toBeEmpty();
    await expect(usage).toBeVisible();
    await expect(debug).toContainText(JSON.stringify(decryptedUsage));
    await expect(debug).not.toContainText(JSON.stringify(untrustedRelayUsage));
    await expect(firstAnswer.getByTestId('sources-used')).toHaveCount(0);

    await composer.fill('A second synthetic fixture prompt');
    await send.click();
    await expect(followupAnswer).toBeVisible();
    await expect(spinner).not.toBeVisible();
    await expect(waiting).toBeEmpty();
    await expect(usage).toHaveCount(0);
    await expect(debug).not.toContainText(JSON.stringify(untrustedRelayUsage));
    await expect(followupAnswer.getByTestId('sources-used')).toHaveCount(0);
    expect(completions).toBe(2);
});
