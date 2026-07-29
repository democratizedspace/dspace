import { constants, publicEncrypt, webcrypto } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

const expectedVersion = process.env.DSPACE_EXPECTED_VERSION!;
const expectedRevision = process.env.DSPACE_EXPECTED_REVISION!;
const expectedProvider = process.env.DSPACE_EXPECTED_PROVIDER as 'token-place' | 'openai';
const expectedOrigin = process.env.DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN;
const expectedModel = process.env.DSPACE_EXPECTED_TOKEN_PLACE_MODEL;
const encoder = new TextEncoder();

const bytesToBase64 = (value: ArrayBuffer | Uint8Array) =>
    Buffer.from(value instanceof Uint8Array ? value : new Uint8Array(value)).toString('base64');
const base64ToPem = (value: string) =>
    `-----BEGIN PUBLIC KEY-----\n${value.match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;

async function relayPublicKey() {
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
    const pem = base64ToPem(bytesToBase64(spki));
    return bytesToBase64(encoder.encode(pem));
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

async function blockUnexpectedProviders(page: Page, allowedOrigin?: string) {
    const providerOrigins = ['https://api.openai.com', allowedOrigin].filter(Boolean) as string[];
    for (const origin of providerOrigins) {
        await page.route(`${origin}/**`, async (route) => {
            await route.abort('blockedbyclient');
            throw new Error('secret-safety: blocked unexpected live chat-provider traffic');
        });
    }
    await page.route(/https?:\/\/[^/]+\/(?:api\/v1\/relay|v1\/responses).*/, async (route) => {
        await route.abort('blockedbyclient');
        throw new Error('secret-safety: blocked unexpected live chat-provider traffic');
    });
}

async function installSuccessfulRelay(page: Page) {
    const key = await relayPublicKey();
    const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
    // Register the deny rule first: Playwright evaluates newer routes first, so only the
    // explicit mocks below can supersede it. Every other path on the provider origin is blocked.
    await blockUnexpectedProviders(page, expectedOrigin);
    await page.route(`${expectedOrigin}/api/v1/relay/servers/next**`, async (route) => {
        calls.push({ url: route.request().url(), headers: route.request().headers(), body: '' });
        const requestUrl = new URL(route.request().url());
        expect(requestUrl.origin, 'routing/configuration: token.place origin drift').toBe(
            expectedOrigin
        );
        expect(
            requestUrl.searchParams.get('model'),
            'routing/configuration: token.place model drift'
        ).toBe(expectedModel);
        const tier = requestUrl.searchParams.get('context_tier');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                server_public_key: key,
                context_tier: tier,
                selected_profile_id: `smoke-${tier}`,
                selected_model_support: [expectedModel],
            }),
        });
    });
    await page.route(`${expectedOrigin}/api/v1/relay/requests`, async (route) => {
        calls.push({
            url: route.request().url(),
            headers: route.request().headers(),
            body: route.request().postData() || '',
        });
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{"accepted":true}',
        });
    });
    await page.route(`${expectedOrigin}/api/v1/relay/responses/retrieve`, async (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        calls.push({ url: route.request().url(), headers: route.request().headers(), body: '' });
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(await encryptedResponse(body)),
        });
    });
    return calls;
}

async function openExpectedPanel(page: Page) {
    await page.goto('/chat');
    await waitForHydration(page);
    const panels = page.locator('[data-testid="chat-panel"]');
    await expect(panels, 'hydration: exactly one chat panel must be active').toHaveCount(1);
    await expect(panels, 'routing/configuration: default provider drift').toHaveAttribute(
        'data-provider',
        expectedProvider
    );
    await expect(panels, 'hydration: chat panel did not hydrate').toHaveAttribute(
        'data-hydrated',
        'true'
    );
    await expect(panels.getByRole('textbox'), 'hydration: textbox is unusable').toBeEnabled();
    await expect(
        panels.getByRole('button', { name: 'Send' }),
        'hydration: Send is unusable'
    ).toBeEnabled();
    return panels;
}

test.describe('release-aware remote chat smoke', () => {
    test.skip(
        process.env.REMOTE_CHAT_SMOKE !== '1',
        'Run through npm run qa:remote-chat-smoke with explicit release expectations.'
    );
    test.use({ serviceWorkers: 'block', storageState: { cookies: [], origins: [] } });
    test.beforeEach(async ({ context, page }) => {
        await context.clearCookies();
        await clearUserData(page);
    });

    test('identity: approved build identity matches JSON and HTML', async ({ page, request }) => {
        const response = await request.get('/build-info.json');
        expect(response.status(), 'identity: /build-info.json did not return 200').toBe(200);
        const identity = await response.json();
        expect(identity.version, 'identity: application-version drift').toBe(expectedVersion);
        expect(identity.revision, 'identity: source-revision drift').toBe(expectedRevision);
        expect(identity.shortRevision, 'identity: invalid derived short revision').toBe(
            expectedRevision.slice(0, 7)
        );
        await page.goto('/chat');
        await expect(
            page.locator('meta[name="dspace-build-revision"]'),
            'identity: HTML build marker drift'
        ).toHaveAttribute('content', expectedRevision);
    });

    test('routing/configuration and submission: approved default journey', async ({ page }) => {
        const calls = expectedProvider === 'token-place' ? await installSuccessfulRelay(page) : [];
        if (expectedProvider === 'openai') await blockUnexpectedProviders(page);
        const panel = await openExpectedPanel(page);
        if (expectedProvider === 'openai') {
            await panel.getByRole('textbox').fill('Key gate smoke');
            await panel.getByRole('button', { name: 'Send' }).click();
            await expect(
                panel.locator('.chat-error'),
                'routing/configuration: OpenAI key gate'
            ).toHaveAttribute('data-error-type', 'missing-key');
            return;
        }
        await panel.getByRole('textbox').fill('Deterministic remote chat smoke');
        await panel.getByRole('button', { name: 'Send' }).click();
        await expect(
            panel.getByText('DSPACE smoke reply.'),
            'submission: no mocked relay reply'
        ).toBeVisible();
        expect(
            calls.map(({ url }) => new URL(url).origin).every((origin) => origin === expectedOrigin)
        ).toBe(true);
        expect(calls).toHaveLength(3);
        for (const call of calls) {
            expect(
                JSON.stringify(call.headers),
                'secret-safety: authorization header was sent'
            ).not.toMatch(/authorization|api.?key|bearer|sk-/i);
            expect(call.body, 'secret-safety: OpenAI credential material was sent').not.toMatch(
                /api.?key|bearer|sk-/i
            );
        }
    });

    test('provider availability: controlled token.place failure is classified and bounded', async ({
        page,
    }) => {
        test.skip(
            expectedProvider !== 'token-place',
            'Only applies to token.place-default releases'
        );
        await blockUnexpectedProviders(page, expectedOrigin);
        await page.route(`${expectedOrigin}/api/v1/relay/servers/next**`, (route) =>
            route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: '{"error":"unavailable"}',
            })
        );
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
        await page.route(/https:\/\/(?:api\.openai\.com|token\.place)\/.*/, async (route) => {
            providerCalls += 1;
            await route.abort('blockedbyclient');
        });
        await page.goto('/settings');
        await waitForHydration(page);
        const option = page.locator('input[name="chat-provider"][value="openai"]');
        await expect(option, 'routing/configuration: OpenAI option is absent').toBeVisible();
        if (!(await option.isChecked())) await option.check();
        await expect(page.getByLabel('OpenAI API key', { exact: true })).toBeVisible();
        const panel = await openExpectedPanelForOpenAI(page);
        await panel.getByRole('textbox').fill('OpenAI missing-key smoke');
        await panel.getByRole('button', { name: 'Send' }).click();
        await expect(panel.locator('.chat-error')).toHaveAttribute(
            'data-error-type',
            'missing-key'
        );
        expect(providerCalls, 'secret-safety: missing-key flow made a provider request').toBe(0);
    });
});

async function openExpectedPanelForOpenAI(page: Page) {
    await page.goto('/chat');
    await waitForHydration(page);
    const panel = page.locator('[data-testid="chat-panel"]');
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute('data-provider', 'openai');
    return panel;
}
