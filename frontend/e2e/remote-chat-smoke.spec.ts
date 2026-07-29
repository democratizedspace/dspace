import { constants, publicEncrypt, webcrypto } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const version = process.env.DSPACE_EXPECTED_VERSION!;
const revision = process.env.DSPACE_EXPECTED_REVISION!;
const provider = process.env.DSPACE_EXPECTED_PROVIDER!;
const tokenOrigin = process.env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN!;
const tokenModel = process.env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL!;
const encoder = new TextEncoder();
const b64 = (value: ArrayBuffer | Uint8Array) =>
    Buffer.from(value instanceof Uint8Array ? value : new Uint8Array(value)).toString('base64');

async function relayKey() {
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
    const spki = b64(await webcrypto.subtle.exportKey('spki', pair.publicKey));
    const pem = `-----BEGIN PUBLIC KEY-----\n${spki.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`;
    return { pem, wire: b64(encoder.encode(pem)) };
}

async function encryptedResponse(clientKey: string, requestId: string, failure = false) {
    const key = await webcrypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const raw = await webcrypto.subtle.exportKey('raw', key);
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const payload = {
        protocol: 'tokenplace_api_v1_relay_e2ee',
        version: 1,
        request_id: requestId,
        client_public_key: clientKey,
        api_v1_response: failure
            ? { status: 503, error: { message: 'Unavailable', type: 'server_error' } }
            : {
                  model: tokenModel,
                  choices: [{ message: { role: 'assistant', content: 'remote smoke reply' } }],
              },
    };
    const ciphertext = b64(
        await webcrypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            key,
            encoder.encode(JSON.stringify(payload))
        )
    );
    const pem = Buffer.from(clientKey, 'base64').toString('utf8');
    const cipherkey = b64(
        publicEncrypt(
            { key: pem, padding: constants.RSA_PKCS1_PADDING },
            Buffer.from(b64(raw), 'utf8')
        )
    );
    return { chat_history: ciphertext, ciphertext, cipherkey, iv: b64(iv) };
}

async function mockTokenPlace(page: Page, failure = false) {
    const key = await relayKey();
    const seen: string[] = [];
    await page.route(`${tokenOrigin}/api/v1/relay/servers/next**`, async (route) => {
        const url = new URL(route.request().url());
        seen.push(url.href);
        expect(url.origin, '[routing/configuration] token.place origin drift').toBe(tokenOrigin);
        expect(
            url.searchParams.get('model'),
            '[routing/configuration] token.place model drift'
        ).toBe(tokenModel);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                server_public_key: key.wire,
                context_tier: url.searchParams.get('context_tier'),
                selected_profile_id: 'remote-smoke',
                model_support: [tokenModel],
            }),
        });
    });
    await page.route(`${tokenOrigin}/api/v1/relay/requests`, async (route) => {
        seen.push(route.request().url());
        expect(
            route.request().headers().authorization,
            '[secret-safety] unexpected authorization'
        ).toBeUndefined();
        expect(route.request().postData() || '').not.toMatch(/api.?key|sk-/i);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{"accepted":true}',
        });
    });
    await page.route(`${tokenOrigin}/api/v1/relay/responses/retrieve`, async (route) => {
        seen.push(route.request().url());
        const body = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
                await encryptedResponse(body.client_public_key, body.request_id, failure)
            ),
        });
    });
    return seen;
}

test.skip(
    process.env.REMOTE_CHAT_SMOKE !== '1',
    'Run through npm run qa:remote-chat-smoke with explicit release expectations.'
);

test('approved non-mutating remote chat journey', async ({ page, request }) => {
    await test.step('identity', async () => {
        const response = await request.get('/build-info.json');
        expect(response.status(), '[identity] build-info request failed').toBe(200);
        const info = await response.json();
        expect(info.version, '[identity] application version drift').toBe(version);
        expect(info.revision, '[identity] source revision drift').toBe(revision);
        expect(info.shortRevision, '[identity] malformed short revision').toBe(
            revision.slice(0, 7)
        );
        const html = await request.get('/chat');
        expect(await html.text(), '[identity] HTML revision marker drift').toContain(
            `<meta name="dspace-build-revision" content="${revision}"`
        );
    });

    await clearUserData(page);
    await page.route(
        /https:\/\/(?:token\.place|staging\.token\.place|api\.openai\.com)\/.*/,
        (route) => route.abort('blockedbyclient')
    );
    const seen = provider === 'token-place' ? await mockTokenPlace(page) : [];
    await page.goto('/chat');
    await waitForHydration(page);
    const panels = page.locator('[data-testid="chat-panel"]');
    await expect(panels, '[hydration] exactly one panel must hydrate').toHaveCount(1);
    await expect(panels, '[routing/configuration] default provider drift').toHaveAttribute(
        'data-provider',
        provider
    );
    await expect(panels.getByRole('textbox'), '[hydration] textbox unusable').toBeEnabled();
    await expect(
        panels.getByRole('button', { name: 'Send' }),
        '[hydration] Send unusable'
    ).toBeEnabled();
    if (provider === 'token-place') {
        await panels.getByRole('textbox').fill('deterministic remote smoke');
        await panels.getByRole('button', { name: 'Send' }).click();
        await expect(
            panels.getByText('remote smoke reply'),
            '[submission] token.place relay submission failed'
        ).toBeVisible();
        expect(seen, '[submission] API v1 relay path was not exercised').toHaveLength(3);

        await clearUserData(page);
        const unavailable = await mockTokenPlace(page, true);
        await page.goto('/chat');
        await waitForHydration(page);
        const panel = page.locator('[data-testid="chat-panel"]');
        await panel.getByRole('textbox').fill('controlled unavailable smoke');
        await panel.getByRole('button', { name: 'Send' }).click();
        await expect(
            panel.locator('.chat-error'),
            '[provider availability] failure was not classified'
        ).toHaveAttribute('data-error-type', 'server');
        await expect(
            panel.locator('.spinner-container'),
            '[provider availability] spinner did not terminate'
        ).not.toBeVisible();
        expect(unavailable.length).toBeGreaterThan(0);
    }

    await clearUserData(page);
    let openAIRequests = 0;
    await page.route('https://api.openai.com/**', async (route) => {
        openAIRequests += 1;
        await route.abort('blockedbyclient');
    });
    await page.goto('/settings');
    await waitForHydration(page);
    const option = page.locator('input[name="chat-provider"][value="openai"]');
    await expect(option, '[routing/configuration] OpenAI opt-in is not discoverable').toBeVisible();
    await option.check();
    await page.goto('/chat');
    await waitForHydration(page);
    const openPanel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
    await openPanel.getByRole('textbox').fill('missing key smoke');
    await openPanel.getByRole('button', { name: 'Send' }).click();
    await expect(
        openPanel.locator('.chat-error'),
        '[secret-safety] missing-key state absent'
    ).toHaveAttribute('data-error-type', 'missing-key');
    expect(openAIRequests, '[secret-safety] OpenAI contacted without a key').toBe(0);
});
