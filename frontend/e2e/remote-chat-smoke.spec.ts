import { constants, createDecipheriv, privateDecrypt, publicEncrypt, webcrypto } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const expected = {
    version: process.env.DSPACE_EXPECTED_VERSION!,
    revision: process.env.DSPACE_EXPECTED_REVISION!,
    provider: process.env.DSPACE_EXPECTED_PROVIDER as 'token-place' | 'openai',
    origin: process.env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN!,
    model: process.env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL!,
};
const encoder = new TextEncoder();
const b64 = (value: ArrayBuffer | Uint8Array) =>
    Buffer.from(value as ArrayBuffer).toString('base64');
const pem = (value: ArrayBuffer, label: string) => {
    const body = b64(value)
        .match(/.{1,64}/g)
        ?.join('\n');
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
};

async function relayKeys() {
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
    const publicPem = pem(await webcrypto.subtle.exportKey('spki', pair.publicKey), 'PUBLIC KEY');
    const privatePem = pem(
        await webcrypto.subtle.exportKey('pkcs8', pair.privateKey),
        'PRIVATE KEY'
    );
    return { publicPem, privatePem, encodedPublic: b64(encoder.encode(publicPem)) };
}

function decryptRequest(body: Record<string, string>, privateKey: string) {
    const encodedKey = privateDecrypt(
        { key: privateKey, padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(body.cipherkey, 'base64')
    ).toString('utf8');
    const decipher = createDecipheriv(
        `aes-${Buffer.from(encodedKey, 'base64').length * 8}-cbc`,
        Buffer.from(encodedKey, 'base64'),
        Buffer.from(body.iv, 'base64')
    );
    return JSON.parse(
        Buffer.concat([
            decipher.update(Buffer.from(body.ciphertext, 'base64')),
            decipher.final(),
        ]).toString('utf8')
    );
}

async function encryptedResponse(clientKey: string, requestId: string, response: object) {
    const clientPem = Buffer.from(clientKey, 'base64').toString('utf8');
    const aes = await webcrypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const raw = await webcrypto.subtle.exportKey('raw', aes);
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        aes,
        encoder.encode(
            JSON.stringify({
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                request_id: requestId,
                client_public_key: clientKey,
                api_v1_response: response,
            })
        )
    );
    return {
        ciphertext: b64(ciphertext),
        chat_history: b64(ciphertext),
        iv: b64(iv),
        cipherkey: b64(
            publicEncrypt(
                { key: clientPem, padding: constants.RSA_PKCS1_PADDING },
                Buffer.from(b64(raw), 'utf8')
            )
        ),
    };
}

async function blockProviders(page: Page) {
    await page.route(
        /https:\/\/(?:[^/]*\.)?token\.place\/.*|https:\/\/api\.openai\.com\/.*/,
        async (route) => {
            const url = new URL(route.request().url());
            if (url.hostname.endsWith('token.place')) {
                expect(url.origin, '[routing/configuration] token.place origin drift').toBe(
                    expected.origin
                );
            }
            await route.abort('blockedbyclient');
        }
    );
}

test('approved release chat journey is isolated, routed, classified, and key-gated', async ({
    page,
    request,
}) => {
    test.setTimeout(90_000);
    const infoResponse = await request.get('/build-info.json');
    expect(infoResponse.status(), '[identity] /build-info.json status').toBe(200);
    const info = await infoResponse.json();
    expect(info.version, '[identity] application version drift').toBe(expected.version);
    expect(info.revision, '[identity] source revision drift').toBe(expected.revision);
    expect(info.shortRevision, '[identity] malformed short revision').toBe(
        expected.revision.slice(0, 7)
    );

    await blockProviders(page);
    await clearUserData(page);
    await page.goto('/chat');
    expect(
        await page.locator('meta[name="dspace-build-revision"]').getAttribute('content'),
        '[identity] HTML revision marker drift'
    ).toBe(expected.revision);
    await waitForHydration(page);
    const panels = page.locator('[data-testid="chat-panel"]');
    await expect(panels, '[hydration] expected exactly one chat panel').toHaveCount(1);
    await expect(panels, '[routing/configuration] default provider drift').toHaveAttribute(
        'data-provider',
        expected.provider
    );
    await expect(panels.getByRole('textbox'), '[hydration] textbox unusable').toBeEnabled();
    await expect(
        panels.getByRole('button', { name: 'Send' }),
        '[hydration] Send unusable'
    ).toBeEnabled();

    if (expected.provider === 'token-place') {
        const keys = await relayKeys();
        let submission: Record<string, string> | undefined;
        let retrievals = 0;
        await page.route(`${expected.origin}/api/v1/relay/servers/next**`, (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    server_public_key: keys.encodedPublic,
                    context_tier: new URL(route.request().url()).searchParams.get('context_tier'),
                    selected_profile_id: 'remote-smoke',
                }),
            })
        );
        await page.route(`${expected.origin}/api/v1/relay/requests`, async (route) => {
            expect(
                route.request().headers().authorization,
                '[secret-safety] authorization leaked'
            ).toBeUndefined();
            submission = JSON.parse(route.request().postData() || '{}');
            const envelope = decryptRequest(submission!, keys.privatePem);
            expect(
                envelope.api_v1_request.model,
                '[routing/configuration] token.place model drift'
            ).toBe(expected.model);
            await route.fulfill({ status: 200, json: { accepted: true } });
        });
        await page.route(`${expected.origin}/api/v1/relay/responses/retrieve`, async (route) => {
            retrievals += 1;
            const body = JSON.parse(route.request().postData() || '{}');
            const apiResponse =
                retrievals === 1
                    ? {
                          model: expected.model,
                          choices: [
                              { message: { role: 'assistant', content: 'remote smoke reply' } },
                          ],
                      }
                    : { status: 503, error: { type: 'server_error', message: 'Unavailable' } };
            await route.fulfill({
                status: 200,
                json: await encryptedResponse(body.client_public_key, body.request_id, apiResponse),
            });
        });

        await panels.getByRole('textbox').fill('deterministic remote smoke');
        await panels.getByRole('button', { name: 'Send' }).click();
        await expect(
            panels.getByText('remote smoke reply'),
            '[submission] mocked relay failed'
        ).toBeVisible();
        expect(submission, '[submission] API v1 relay request absent').toBeDefined();

        await panels.getByRole('textbox').fill('controlled unavailable check');
        await panels.getByRole('button', { name: 'Send' }).click();
        await expect(
            panels.locator('[data-error-type="server"]'),
            '[provider availability] HTTP 503 was not stably classified'
        ).toBeVisible();
        await expect(
            panels.locator('.spinner-container'),
            '[provider availability] spinner persisted'
        ).toBeHidden();
    }

    await clearUserData(page);
    let openAIRequests = 0;
    await page.route('https://api.openai.com/**', async (route) => {
        openAIRequests += 1;
        await route.abort('blockedbyclient');
    });
    await page.goto('/settings');
    await waitForHydration(page);
    const openAI = page.locator('input[name="chat-provider"][value="openai"]');
    await expect(openAI, '[routing/configuration] OpenAI option missing').toBeVisible();
    await openAI.check();
    await page.goto('/chat');
    await waitForHydration(page);
    const openAIPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
    await openAIPanel.getByRole('textbox').fill('must remain key gated');
    await openAIPanel.getByRole('button', { name: 'Send' }).click();
    await expect(
        openAIPanel.locator('[data-error-type="missing-key"]'),
        '[secret-safety] missing-key state absent'
    ).toBeVisible();
    expect(openAIRequests, '[secret-safety] OpenAI request occurred without a key').toBe(0);
});
