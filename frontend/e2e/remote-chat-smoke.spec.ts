import { constants, publicEncrypt, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';

import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const JSEncrypt = createRequire(import.meta.url)(
    'jsencrypt'
) as typeof import('jsencrypt').JSEncrypt;

const expectedVersion = process.env.DSPACE_EXPECTED_VERSION!;
const expectedRevision = process.env.DSPACE_EXPECTED_REVISION!;
type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';

function normalizeIdentityContract(value: string | undefined): IdentityContract {
    if (value === undefined) return 'build-info-v1';

    const normalized = value.trim();
    if (normalized === 'build-info-v1' || normalized === 'legacy-build-meta-v1') {
        return normalized;
    }

    throw new Error('DSPACE_EXPECTED_IDENTITY_CONTRACT must select a supported identity contract');
}

const identityContract = normalizeIdentityContract(process.env.DSPACE_EXPECTED_IDENTITY_CONTRACT);
const expectedProvider = process.env.DSPACE_EXPECTED_PROVIDER as 'token-place' | 'openai';
const expectedOrigin = process.env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN;
const expectedModel = process.env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL;
const remoteChatSmokeEnabled = process.env.REMOTE_CHAT_SMOKE === '1';
const requestedOrigin = remoteChatSmokeEnabled ? new URL(process.env.BASE_URL!).origin : undefined;
const fault = process.env.DSPACE_REMOTE_CHAT_SMOKE_FAULT;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

test.use({
    serviceWorkers: 'block',
    storageState: { cookies: [], origins: [] },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
});

const bytesToBase64 = (value: ArrayBuffer | Uint8Array) =>
    Buffer.from(value instanceof Uint8Array ? value : new Uint8Array(value)).toString('base64');
const base64ToPem = (value: string) =>
    `-----BEGIN PUBLIC KEY-----\n${value.match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;

type RelayEvidence = {
    paths: string[];
    originsMatch: boolean;
    credentialsPresent: boolean;
    dispatchModelMatches: boolean;
};

async function relayKeypair() {
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
    const pkcs8 = await webcrypto.subtle.exportKey('pkcs8', pair.privateKey);
    return {
        publicKey: bytesToBase64(encoder.encode(base64ToPem(bytesToBase64(spki)))),
        privateKey: `-----BEGIN PRIVATE KEY-----\n${bytesToBase64(pkcs8)
            .match(/.{1,64}/g)
            ?.join('\n')}\n-----END PRIVATE KEY-----`,
    };
}

async function decryptDispatch(body: Record<string, string>, privateKey: string) {
    try {
        const rsa = new JSEncrypt();
        rsa.setPrivateKey(privateKey);
        // JSEncrypt wraps the base64 representation of the AES key.
        const decryptedKey = rsa.decrypt(body.cipherkey);
        if (!decryptedKey) throw new Error('empty decrypted key');
        const aesBytes = Buffer.from(decryptedKey, 'base64');
        if (aesBytes.length === 0) throw new Error('empty AES key');
        const aesKey = await webcrypto.subtle.importKey(
            'raw',
            aesBytes,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );
        const plaintext = await webcrypto.subtle.decrypt(
            { name: 'AES-CBC', iv: Buffer.from(body.iv, 'base64') },
            aesKey,
            Buffer.from(body.ciphertext, 'base64')
        );
        const envelope = JSON.parse(decoder.decode(plaintext));
        return envelope?.api_v1_request?.model === expectedModel;
    } catch {
        throw new Error('routing/configuration: encrypted dispatch could not be verified');
    }
}

async function encryptedResponse(body: Record<string, string>) {
    const response = {
        protocol: 'tokenplace_api_v1_relay_e2ee',
        version: 1,
        request_id: body.request_id,
        client_public_key: body.client_public_key,
        api_v1_response: {
            id: 'chatcmpl-dspace-smoke',
            object: 'chat.completion',
            created: 1780000000,
            model: expectedModel,
            choices: [{ message: { role: 'assistant', content: 'DSPACE smoke reply.' } }],
        },
    };
    const key = await webcrypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const rawKey = await webcrypto.subtle.exportKey('raw', key);
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        encoder.encode(JSON.stringify(response))
    );
    const clientPem = Buffer.from(body.client_public_key, 'base64').toString('utf8');
    const cipherkey = publicEncrypt(
        { key: clientPem, padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(bytesToBase64(rawKey), 'utf8')
    ).toString('base64');
    return {
        chat_history: bytesToBase64(ciphertext),
        ciphertext: bytesToBase64(ciphertext),
        cipherkey,
        iv: bytesToBase64(iv),
    };
}

async function installProviderDenyRules(page: Page) {
    const abortDrift = async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
        await route.abort('blockedbyclient');
        throw new Error('routing/configuration: blocked unmatched provider transport');
    };
    // These are registered before exact mocks because Playwright gives the newest route priority.
    await page.route('https://api.openai.com/**', abortDrift);
    if (expectedOrigin) await page.route(`${expectedOrigin}/**`, abortDrift);
    await page.route(/https?:\/\/[^/]+\/api\/v1\/(?:relay|chat\/completions).*/, abortDrift);
    await page.route(`${requestedOrigin}/api/chat`, abortDrift);
}

async function installSuccessfulRelay(page: Page) {
    const key = await relayKeypair();
    const evidence: RelayEvidence = {
        paths: [],
        originsMatch: true,
        credentialsPresent: false,
        dispatchModelMatches: false,
    };
    await installProviderDenyRules(page);

    const handle = async (
        route: Parameters<Parameters<Page['route']>[1]>[0],
        operation: string,
        payload: Record<string, string>
    ) => {
        const request = route.request();
        evidence.paths.push(operation);
        evidence.originsMatch &&=
            new URL(request.url()).origin ===
            (request.url().includes('/api/chat') ? requestedOrigin : expectedOrigin);
        const headerNames = Object.keys(request.headers()).map((name) => name.toLowerCase());
        evidence.credentialsPresent ||= headerNames.some(
            (name) => name === 'authorization' || name.includes('api-key')
        );
        if (operation === 'select') {
            const model = payload.model || new URL(request.url()).searchParams.get('model');
            if (model !== expectedModel)
                throw new Error('routing/configuration: token.place model drift');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    server_public_key: key.publicKey,
                    context_tier:
                        payload.contextTier ||
                        new URL(request.url()).searchParams.get('context_tier'),
                    selected_profile_id: 'dspace-smoke',
                    selected_model_support: [expectedModel],
                }),
            });
        } else if (operation === 'dispatch') {
            evidence.dispatchModelMatches = await decryptDispatch(payload, key.privateKey);
            await route.fulfill({
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'x-dspace-correlation-token': 'bounded-smoke-correlation',
                },
                body: '{"accepted":true}',
            });
        } else if (operation === 'retrieve') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(await encryptedResponse(payload)),
            });
        } else if (operation === 'complete') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: '{"ok":true}',
            });
        } else {
            await route.abort('blockedbyclient');
            throw new Error('routing/configuration: unexpected token.place proxy operation');
        }
    };

    await page.route(`${expectedOrigin}/api/v1/relay/servers/next**`, (route) => {
        const url = new URL(route.request().url());
        return handle(route, 'select', {
            model: url.searchParams.get('model') || '',
            contextTier: url.searchParams.get('context_tier') || '',
        });
    });
    await page.route(`${expectedOrigin}/api/v1/relay/requests`, (route) =>
        handle(route, 'dispatch', JSON.parse(route.request().postData() || '{}'))
    );
    await page.route(`${expectedOrigin}/api/v1/relay/responses/retrieve`, (route) =>
        handle(route, 'retrieve', JSON.parse(route.request().postData() || '{}'))
    );
    await page.route(`${requestedOrigin}/api/chat`, async (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        if (
            body.provider !== 'tokenplace' ||
            !['select', 'dispatch', 'retrieve', 'complete'].includes(body.operation)
        ) {
            await route.abort('blockedbyclient');
            throw new Error('routing/configuration: unexpected chat proxy request');
        }
        await handle(route, body.operation, body.payload || {});
    });
    return evidence;
}

async function openExpectedPanel(page: Page, provider = expectedProvider) {
    const navigation = await page.goto('/chat');
    expect(
        new URL(navigation?.url() || page.url()).origin,
        'routing/configuration: /chat origin drift'
    ).toBe(requestedOrigin);
    await waitForHydration(page);
    if (fault === 'hydration') throw new Error('hydration: injected bounded CI fault');
    const panels = page.locator('[data-testid="chat-panel"]');
    await expect(panels, 'hydration: exactly one chat panel must be active').toHaveCount(1);
    await expect(panels, 'routing/configuration: default provider drift').toHaveAttribute(
        'data-provider',
        provider
    );
    await expect(panels, 'hydration: chat panel did not hydrate').toHaveAttribute(
        'data-hydrated',
        'true'
    );
    return panels;
}

async function selectOpenAI(page: Page, key?: string) {
    await page.goto('/settings');
    await waitForHydration(page);
    const option = page.locator('input[name="chat-provider"][value="openai"]');
    if (!(await option.isChecked())) await option.check();
    if (key) {
        await page.getByLabel('OpenAI API key', { exact: true }).fill(key);
        await page.getByRole('button', { name: 'Save OpenAI API key' }).click();
    }
}

test.describe('release-aware remote chat smoke', () => {
    test.skip(!remoteChatSmokeEnabled, 'Requires explicit release expectations.');
    test.beforeEach(async ({ context, page }) => {
        await context.clearCookies();
        await clearUserData(page);
    });

    test('identity: approved build identity matches JSON and HTML', async ({ page, request }) => {
        if (identityContract === 'legacy-build-meta-v1') {
            const response = await request.get('/build-meta.json');
            expect(
                new URL(response.url()).origin,
                'routing/configuration: /build-meta.json origin drift'
            ).toBe(requestedOrigin);
            expect(response.status(), 'identity: /build-meta.json did not return 200').toBe(200);
            const identity: unknown = await response.json();
            expect(
                identity !== null && typeof identity === 'object' && !Array.isArray(identity),
                'identity: /build-meta.json did not return an object'
            ).toBe(true);
            const legacyIdentity = identity as Record<string, unknown>;
            expect(legacyIdentity.gitSha, 'identity: source-revision drift').toBe(expectedRevision);
            expect(
                typeof legacyIdentity.generatedAt === 'string' &&
                    legacyIdentity.generatedAt.trim().length > 0 &&
                    Number.isFinite(Date.parse(legacyIdentity.generatedAt)),
                'identity: generatedAt must be a non-empty valid timestamp'
            ).toBe(true);
            expect(
                typeof legacyIdentity.source === 'string' &&
                    legacyIdentity.source.trim().length > 0,
                'identity: source must be a non-empty string'
            ).toBe(true);
            return;
        }
        const response = await request.get('/build-info.json');
        expect(
            new URL(response.url()).origin,
            'routing/configuration: /build-info.json origin drift'
        ).toBe(requestedOrigin);
        expect(response.status(), 'identity: /build-info.json did not return 200').toBe(200);
        const identity = await response.json();
        expect(identity.version, 'identity: application-version drift').toBe(expectedVersion);
        expect(identity.revision, 'identity: source-revision drift').toBe(expectedRevision);
        expect(identity.shortRevision, 'identity: invalid derived short revision').toBe(
            expectedRevision.slice(0, 7)
        );
        const navigation = await page.goto('/chat');
        expect(
            new URL(navigation?.url() || page.url()).origin,
            'routing/configuration: /chat origin drift'
        ).toBe(requestedOrigin);
        await expect(
            page.locator('meta[name="dspace-build-revision"]'),
            'identity: HTML build marker drift'
        ).toHaveAttribute('content', expectedRevision);
    });

    test('routing/configuration and submission: approved default journey', async ({ page }) => {
        if (expectedProvider === 'openai') {
            let openAICalls = 0;
            let credentialPresent = false;
            await installProviderDenyRules(page);
            let panel = await openExpectedPanel(page);
            await panel.getByRole('textbox').fill('Key gate smoke');
            await panel.getByRole('button', { name: 'Send' }).click();
            await expect(
                panel.locator('.chat-error'),
                'routing/configuration: OpenAI key gate'
            ).toHaveAttribute('data-error-type', 'missing-key');
            expect(openAICalls, 'secret-safety: missing-key flow made a provider request').toBe(0);
            const fakeKey = 'sk-dspace-ci-sentinel-not-a-real-credential'; // scan-secrets: ignore
            await selectOpenAI(page, fakeKey);
            await page.route('https://api.openai.com/v1/responses', async (route) => {
                openAICalls += 1;
                credentialPresent =
                    route.request().headers().authorization?.startsWith('Bearer ') === true;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'resp_smoke',
                        object: 'response',
                        status: 'completed',
                        output: [
                            {
                                type: 'message',
                                role: 'assistant',
                                content: [
                                    { type: 'output_text', text: 'DSPACE OpenAI smoke reply.' },
                                ],
                            },
                        ],
                    }),
                });
            });
            panel = await openExpectedPanel(page);
            await panel.getByRole('textbox').fill('Mocked OpenAI smoke');
            await panel.getByRole('button', { name: 'Send' }).click();
            await expect(
                panel.getByText('DSPACE OpenAI smoke reply.'),
                'submission: no mocked OpenAI reply'
            ).toBeVisible();
            expect({ openAICalls, credentialPresent }).toEqual({
                openAICalls: 1,
                credentialPresent: true,
            });
            return;
        }
        const configResponse = await page.request.get('/config.json');
        expect(
            new URL(configResponse.url()).origin,
            'routing/configuration: /config.json origin drift'
        ).toBe(requestedOrigin);
        expect(
            configResponse.status(),
            'routing/configuration: /config.json did not return 200'
        ).toBe(200);
        const config = await configResponse.json();
        expect(
            new URL(config.tokenPlace.url).origin,
            'routing/configuration: token.place configured origin drift'
        ).toBe(expectedOrigin);
        expect(
            config.tokenPlace.model,
            'routing/configuration: token.place configured model drift'
        ).toBe(expectedModel);
        const evidence = await installSuccessfulRelay(page);
        const panel = await openExpectedPanel(page);
        await panel.getByRole('textbox').fill('Deterministic remote chat smoke');
        await panel.getByRole('button', { name: 'Send' }).click();
        if (fault === 'submission') throw new Error('submission: injected bounded CI fault');
        await expect(
            panel.getByText('DSPACE smoke reply.'),
            'submission: no mocked relay reply'
        ).toBeVisible();
        expect(evidence.originsMatch, 'routing/configuration: token.place origin drift').toBe(true);
        expect(evidence.credentialsPresent, 'secret-safety: provider credential was sent').toBe(
            false
        );
        expect(
            evidence.dispatchModelMatches,
            'routing/configuration: encrypted dispatch model drift'
        ).toBe(true);
        expect(evidence.paths.filter((path) => path !== 'complete')).toEqual([
            'select',
            'dispatch',
            'retrieve',
        ]);
    });

    test('provider availability: controlled token.place failure is classified and bounded', async ({
        page,
    }) => {
        test.skip(expectedProvider !== 'token-place', 'Only applies to token.place releases');
        await installProviderDenyRules(page);
        await page.route(`${expectedOrigin}/api/v1/relay/servers/next**`, (route) =>
            route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: '{"error":"unavailable"}',
            })
        );
        await page.route(`${requestedOrigin}/api/chat`, async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            if (body.provider === 'tokenplace' && body.operation === 'select')
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: '{"error":"unavailable"}',
                });
            else await route.abort('blockedbyclient');
        });
        const panel = await openExpectedPanel(page);
        await panel.getByRole('textbox').fill('Controlled unavailable smoke');
        await panel.getByRole('button', { name: 'Send' }).click();
        await expect(
            panel.locator('.chat-error'),
            'provider availability: failure was unclassified'
        ).toHaveAttribute('data-error-type', 'server');
        await expect(
            panel.locator('.spinner-container'),
            'provider availability: loading did not terminate'
        ).not.toBeVisible();
    });

    test('routing/configuration: OpenAI remains discoverable and key-gated', async ({ page }) => {
        let providerCalls = 0;
        await installProviderDenyRules(page);
        page.on('request', (request) => {
            if (['https://api.openai.com', expectedOrigin].includes(new URL(request.url()).origin))
                providerCalls += 1;
        });
        await selectOpenAI(page);
        const panel = await openExpectedPanel(page, 'openai');
        await panel.getByRole('textbox').fill('OpenAI missing-key smoke');
        await panel.getByRole('button', { name: 'Send' }).click();
        await expect(panel.locator('.chat-error')).toHaveAttribute(
            'data-error-type',
            'missing-key'
        );
        expect(providerCalls, 'secret-safety: missing-key flow made a provider request').toBe(0);
    });
});
