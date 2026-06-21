import { webcrypto } from 'node:crypto';

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

const encoder = new TextEncoder();
const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array) =>
    Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString('base64');
const base64ToBytes = (value: string) => Uint8Array.from(Buffer.from(value, 'base64'));
const base64ToPem = (base64: string) =>
    `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;
const pemToBase64 = (pem: string) =>
    pem.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/g, '');

const relayErrorResponse = (mode: TokenPlaceStubMode) => {
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
    const aesKey = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
    ]);
    const rawAesKey = await webcrypto.subtle.exportKey('raw', aesKey);
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
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
    const cipherkey = await webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey);
    return {
        ciphertext: bytesToBase64(ciphertext),
        cipherkey: bytesToBase64(cipherkey),
        iv: bytesToBase64(iv),
    };
}

const installTokenPlaceStub = async (page: Page, mode: TokenPlaceStubMode) => {
    const serverKey = await generateRelayKeypair();

    await page.route('https://token.place/api/v1/relay/servers/next', async (route) => {
        if (mode === 'network-error') {
            await route.abort('failed');
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ server_public_key: serverKey.publicKeyBase64 }),
        });
    });

    await page.route('https://token.place/api/v1/relay/requests', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ accepted: true }),
        });
    });

    await page.route('https://token.place/api/v1/relay/responses/retrieve', async (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        const encrypted = await encryptRelayEnvelope(
            {
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                request_id: body.request_id,
                client_public_key: body.client_public_key,
                api_v1_response: relayErrorResponse(mode),
            },
            body.client_public_key
        );
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(encrypted),
        });
    });

    await page.route('https://token.place/api/v1/chat/completions', async (route) => {
        throw new Error(`Unexpected legacy token.place request: ${route.request().url()}`);
    });
};

const seedTokenPlaceDefaultState = async (page: Page) => {
    await page.addInitScript(() => {
        const state = {
            tokenPlace: { enabled: false },
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
