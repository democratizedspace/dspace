import { constants, privateDecrypt, publicEncrypt, webcrypto } from 'node:crypto';
import { expect, test, type Page, type Route } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

const expected = {
    version: process.env.DSPACE_EXPECTED_VERSION!,
    revision: process.env.DSPACE_EXPECTED_REVISION!,
    provider: process.env.DSPACE_EXPECTED_PROVIDER as 'token-place' | 'openai',
    origin: process.env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN,
    model: process.env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL,
};
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const b64 = (value: ArrayBuffer | Uint8Array) => Buffer.from(value).toString('base64');
const pem = (value: string, label = 'PUBLIC KEY') =>
    `-----BEGIN ${label}-----\n${value.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;

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
    const publicPem = pem(b64(await webcrypto.subtle.exportKey('spki', pair.publicKey)));
    const privatePem = pem(
        b64(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey)),
        'PRIVATE KEY'
    );
    return { publicPem, privatePem, encodedPublic: b64(encoder.encode(publicPem)) };
}

async function encryptResponse(payload: object, clientKey: string) {
    const aes = await webcrypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const raw = await webcrypto.subtle.exportKey('raw', aes);
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        aes,
        encoder.encode(JSON.stringify(payload))
    );
    return {
        ciphertext: b64(ciphertext),
        chat_history: b64(ciphertext),
        iv: b64(iv),
        cipherkey: b64(
            publicEncrypt(
                {
                    key: Buffer.from(clientKey, 'base64').toString(),
                    padding: constants.RSA_PKCS1_PADDING,
                },
                Buffer.from(b64(raw))
            )
        ),
    };
}

async function decryptRequest(body: Record<string, string>, privateKey: string) {
    const encodedAes = privateDecrypt(
        { key: privateKey, padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(body.cipherkey, 'base64')
    ).toString();
    const aes = await webcrypto.subtle.importKey(
        'raw',
        Buffer.from(encodedAes, 'base64'),
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );
    const plaintext = await webcrypto.subtle.decrypt(
        { name: 'AES-CBC', iv: Buffer.from(body.iv, 'base64') },
        aes,
        Buffer.from(body.ciphertext, 'base64')
    );
    return JSON.parse(decoder.decode(plaintext));
}

async function installTrafficGuard(page: Page, allowedOrigin?: string) {
    const unexpected: string[] = [];
    await page.route(/https:\/\/(?:api\.openai\.com|[^/]*token\.place)\/.*/, async (route) => {
        if (allowedOrigin && route.request().url().startsWith(`${allowedOrigin}/api/v1/relay/`)) {
            await route.fallback();
            return;
        }
        unexpected.push(new URL(route.request().url()).origin);
        await route.abort('blockedbyclient');
    });
    return unexpected;
}

async function installTokenPlace(page: Page, unavailable = false) {
    const origin = expected.origin!;
    const keys = await relayKeys();
    const evidence: { paths: string[]; model?: string; safe?: boolean } = { paths: [] };
    await page.route(`${origin}/api/v1/relay/servers/next**`, async (route) => {
        const url = new URL(route.request().url());
        evidence.paths.push(url.pathname);
        evidence.model = url.searchParams.get('model') || undefined;
        if (unavailable) {
            await route.fulfill({ status: 503, body: '{"error":{"type":"server_error"}}' });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                server_public_key: keys.encodedPublic,
                context_tier: url.searchParams.get('context_tier'),
                selected_model_support: [expected.model],
            }),
        });
    });
    await page.route(`${origin}/api/v1/relay/requests`, async (route) => {
        evidence.paths.push(new URL(route.request().url()).pathname);
        const request = route.request();
        const body = JSON.parse(request.postData() || '{}');
        const decrypted = await decryptRequest(body, keys.privatePem);
        evidence.safe =
            !request.headers().authorization &&
            !JSON.stringify(decrypted).match(/api[_-]?key|authorization|sk-/i) &&
            decrypted.model === expected.model;
        await route.fulfill({ status: 200, body: '{"accepted":true}' });
    });
    await page.route(`${origin}/api/v1/relay/responses/retrieve`, async (route) => {
        evidence.paths.push(new URL(route.request().url()).pathname);
        const body = JSON.parse(route.request().postData() || '{}');
        const envelope = await encryptResponse(
            {
                protocol: 'tokenplace_api_v1_relay_e2ee',
                version: 1,
                request_id: body.request_id,
                client_public_key: body.client_public_key,
                api_v1_response: {
                    model: expected.model,
                    choices: [{ message: { role: 'assistant', content: 'Remote smoke reply.' } }],
                },
            },
            body.client_public_key
        );
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(envelope),
        });
    });
    return evidence;
}

async function submit(page: Page) {
    const panel = page.locator('[data-testid="chat-panel"]');
    await panel.getByRole('textbox').fill('Deterministic release smoke request.');
    await panel.getByRole('button', { name: 'Send' }).click();
    return panel;
}

test.describe('release-aware remote chat smoke', () => {
    test.use({ serviceWorkers: 'block', storageState: { cookies: [], origins: [] } });

    test('verifies identity, routing, deterministic submission, availability, and OpenAI opt-in', async ({
        page,
        request,
    }) => {
        await test.step('identity', async () => {
            const response = await request.get('/build-info.json');
            expect(response.status(), 'identity: /build-info.json status').toBe(200);
            const identity = await response.json();
            expect(identity.version, 'identity: application version drift').toBe(expected.version);
            expect(identity.revision, 'identity: full source revision drift').toBe(
                expected.revision
            );
            expect(identity.shortRevision, 'identity: derived short revision drift').toBe(
                expected.revision.slice(0, 7)
            );
            await page.goto('/chat');
            await expect(
                page.locator('meta[name="dspace-build-revision"]'),
                'identity: HTML marker drift'
            ).toHaveAttribute('content', expected.revision);
        });

        await purgeClientState(page);
        const unexpected = await installTrafficGuard(page, expected.origin);
        const evidence = expected.provider === 'token-place' ? await installTokenPlace(page) : null;
        if (expected.provider === 'openai') {
            await page.addInitScript(() => {
                // Test-owned transport: it never creates an OpenAI network request.
                // @ts-expect-error bounded Playwright hook supported by the chat client
                window.__DSpaceOpenAIClient = function () {
                    return {
                        responses: { create: async () => ({ output_text: 'Remote smoke reply.' }) },
                    };
                };
            });
        }
        await page.goto('/chat');
        await test.step('hydration and routing/configuration', async () => {
            await waitForHydration(page);
            const panels = page.locator('[data-testid="chat-panel"]');
            await expect(panels, 'routing/configuration: exactly one panel').toHaveCount(1);
            await expect(panels, 'routing/configuration: default provider drift').toHaveAttribute(
                'data-provider',
                expected.provider
            );
            await expect(panels.getByRole('textbox'), 'hydration: textbox unusable').toBeEnabled();
            await expect(
                panels.getByRole('button', { name: 'Send' }),
                'hydration: Send unusable'
            ).toBeEnabled();
        });
        if (expected.provider === 'token-place') {
            const panel = await submit(page);
            await expect(
                panel.getByText('Remote smoke reply.'),
                'submission: token.place relay did not complete'
            ).toBeVisible();
            expect(evidence?.model, 'routing/configuration: token.place model drift').toBe(
                expected.model
            );
            expect(
                evidence?.safe,
                'secret-safety: provider request contained credentials or wrong encrypted model'
            ).toBe(true);
            expect(evidence?.paths, 'submission: API v1 relay path drift').toEqual([
                '/api/v1/relay/servers/next',
                '/api/v1/relay/requests',
                '/api/v1/relay/responses/retrieve',
            ]);

            await purgeClientState(page);
            await page.unrouteAll({ behavior: 'wait' });
            await installTrafficGuard(page, expected.origin);
            await installTokenPlace(page, true);
            await page.goto('/chat');
            await waitForHydration(page);
            const unavailablePanel = await submit(page);
            await expect(
                unavailablePanel.locator('[data-error-type="server"]'),
                'provider availability: HTTP 503 was not classified'
            ).toBeVisible();
            await expect(
                unavailablePanel.locator('.spinner-container'),
                'provider availability: spinner did not terminate'
            ).toBeHidden();
        } else {
            await page.goto('/settings');
            await waitForHydration(page);
            await page
                .getByLabel('OpenAI API key', { exact: true })
                .fill('sk-fake-remote-smoke-only');
            await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
            await page.goto('/chat');
            await waitForHydration(page);
            const panel = await submit(page);
            await expect(
                panel.getByText('Remote smoke reply.'),
                'submission: mocked OpenAI opt-in did not complete'
            ).toBeVisible();
        }
        expect(unexpected, 'secret-safety: unexpected live provider traffic').toEqual([]);

        await purgeClientState(page);
        await page.unrouteAll({ behavior: 'wait' });
        let providerCalls = 0;
        await page.route(
            /https:\/\/(?:api\.openai\.com|[^/]*token\.place)\/.*/,
            async (route: Route) => {
                providerCalls += 1;
                await route.abort('blockedbyclient');
            }
        );
        await page.goto('/settings');
        await waitForHydration(page);
        const openai = page.locator('input[name="chat-provider"][value="openai"]');
        await expect(openai, 'routing/configuration: OpenAI option missing').toBeVisible();
        await openai.check();
        await page.goto('/chat');
        await waitForHydration(page);
        const openaiPanel = await submit(page);
        await expect(
            openaiPanel.locator('[data-error-type="missing-key"]'),
            'routing/configuration: OpenAI missing-key gate absent'
        ).toBeVisible();
        expect(providerCalls, 'secret-safety: keyless OpenAI attempted provider traffic').toBe(0);
    });
});
