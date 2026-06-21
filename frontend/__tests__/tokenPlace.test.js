import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
const jest = vi;

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(),
    ready: Promise.resolve(),
}));

jest.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: jest.fn(async () => ({ excerptsText: '', sources: [] })),
}));

const { loadGameState } = await import('../src/utils/gameState/common.js');
const {
    TokenPlaceChatV2,
    buildTokenPlaceChatCompletionsUrl,
    buildTokenPlaceMetadata,
    decryptRelayEnvelope,
    encryptRelayEnvelope,
    extractTokenPlaceAssistantText,
    generateRelayClientKeyPair,
    getTokenPlaceChatModel,
    normalizeRelayPublicKey,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
    validateRelayResponseEnvelope,
} = await import('../src/utils/tokenPlace.js');
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');
const { buildChatPrompt } = await import('../src/utils/openAI.js');

const pemFromKey = async (key) => {
    const der = await crypto.subtle.exportKey('spki', key);
    const base64 = Buffer.from(der).toString('base64');
    const chunks = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN PUBLIC KEY-----\n${chunks.join('\n')}\n-----END PUBLIC KEY-----`;
};

const createServerKeys = async () => {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
        },
        true,
        ['encrypt', 'decrypt']
    );
    const publicKeyPem = await pemFromKey(keyPair.publicKey);
    return {
        ...keyPair,
        publicKeyPem,
        serverPublicKeyBase64: Buffer.from(publicKeyPem).toString('base64'),
    };
};

const okJson = (body = {}, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 202 ? 'Accepted' : 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
});

const tokenPlacePayload = (content = 'mocked reply') => ({
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
    metadata: { client: 'dspace', provider: 'token.place' },
});

const installRelayFetch = async ({ retrieve202s = 0, serverKeys } = {}) => {
    const keys = serverKeys || (await createServerKeys());
    let pending202 = retrieve202s;
    const calls = [];
    global.fetch = jest.fn(async (url, init = {}) => {
        const body = init.body ? JSON.parse(init.body) : undefined;
        calls.push({ url, init, body });
        if (url.endsWith('/api/v1/relay/servers/next')) {
            return okJson({ server_public_key: keys.serverPublicKeyBase64 });
        }
        if (url.endsWith('/api/v1/relay/requests')) {
            return okJson({ queued: true });
        }
        if (url.endsWith('/api/v1/relay/responses/retrieve')) {
            if (pending202 > 0) {
                pending202 -= 1;
                return okJson({ status: 'pending' }, 202);
            }
            const clientPem = Buffer.from(body.client_public_key, 'base64').toString('utf8');
            const encrypted = await encryptRelayEnvelope(
                {
                    protocol: 'tokenplace_api_v1_relay_e2ee',
                    version: 1,
                    request_id: body.request_id,
                    client_public_key: body.client_public_key,
                    api_v1_response: tokenPlacePayload(),
                },
                clientPem
            );
            return okJson(encrypted);
        }
        if (url.endsWith('/api/v1/relay/requests/cancel')) {
            return okJson({ canceled: true });
        }
        throw new Error(`Unexpected URL ${url}`);
    });
    return { calls, keys };
};

const getCalls = (path) => fetch.mock.calls.filter(([url]) => String(url).endsWith(path));
const getRelayRequestBody = () => JSON.parse(getCalls('/api/v1/relay/requests')[0][1].body);

describe('token.place API v1 relay-blind client', () => {
    beforeEach(() => {
        loadGameState.mockReturnValue({});
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('fresh/default state uses relay E2EE routes instead of plaintext chat completions', async () => {
        await installRelayFetch();
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getCalls('/api/v1/relay/servers/next')).toHaveLength(1);
        expect(getCalls('/api/v1/relay/requests')).toHaveLength(1);
        expect(getCalls('/api/v1/relay/responses/retrieve')).toHaveLength(1);
        expect(
            fetch.mock.calls.some(([url]) => String(url).includes('/api/v1/chat/completions'))
        ).toBe(false);
        expect(fetch.mock.calls.every(([, init]) => init.credentials === 'omit')).toBe(true);
    });

    test('relay request body is ciphertext-only safe routing metadata', async () => {
        await installRelayFetch();
        await TokenPlaceChatV2([{ role: 'user', content: 'PLAYERSTATE_SECRET_SENTINEL hello' }], {
            promptPayload: {
                combinedMessages: [
                    {
                        role: 'system',
                        content: 'DOCS_GROUNDING_SENTINEL PlayerState questsFinished',
                    },
                    {
                        role: 'user',
                        content: 'PLAYERSTATE_SECRET_SENTINEL INVENTORY_SAVE_SENTINEL',
                    },
                ],
                contextSources: [],
                gameState: {},
            },
            metadata: {
                rawSaveState: 'INVENTORY_SAVE_SENTINEL',
                conversation_id: 'safe-conv',
            },
        });
        const body = getRelayRequestBody();
        expect(body).toEqual(
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
        const serialized = JSON.stringify(body);
        expect(serialized).not.toContain('PLAYERSTATE_SECRET_SENTINEL');
        expect(serialized).not.toContain('DOCS_GROUNDING_SENTINEL');
        expect(serialized).not.toContain('INVENTORY_SAVE_SENTINEL');
        expect(serialized).not.toContain('questsFinished');
        expect(serialized).not.toContain('messages');
        expect(serialized).not.toContain('metadata');
    });

    test('HTTP 202 retrieve polling continues until final encrypted response', async () => {
        await installRelayFetch({ retrieve202s: 2 });
        await expect(
            tokenPlaceChat([{ role: 'user', content: 'hello' }], { pollIntervalMs: 1 })
        ).resolves.toBe('mocked reply');
        expect(getCalls('/api/v1/relay/responses/retrieve')).toHaveLength(3);
    });

    test('terminal selected-server failure clears selection and reselects another node', async () => {
        const first = await createServerKeys();
        const second = await createServerKeys();
        let serverSelections = 0;
        global.fetch = jest.fn(async (url, init = {}) => {
            const body = init.body ? JSON.parse(init.body) : undefined;
            if (url.endsWith('/api/v1/relay/servers/next')) {
                serverSelections += 1;
                return okJson({
                    server_public_key: (serverSelections === 1 ? first : second)
                        .serverPublicKeyBase64,
                });
            }
            if (url.endsWith('/api/v1/relay/requests')) {
                return serverSelections === 1
                    ? okJson({ error: 'gone' }, 410)
                    : okJson({ queued: true });
            }
            if (url.endsWith('/api/v1/relay/responses/retrieve')) {
                const clientPem = Buffer.from(body.client_public_key, 'base64').toString('utf8');
                return okJson(
                    await encryptRelayEnvelope(
                        {
                            protocol: 'tokenplace_api_v1_relay_e2ee',
                            version: 1,
                            request_id: body.request_id,
                            client_public_key: body.client_public_key,
                            api_v1_response: tokenPlacePayload('reselected reply'),
                        },
                        clientPem
                    )
                );
            }
            throw new Error(`Unexpected URL ${url}`);
        });
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'reselected reply'
        );
        expect(getCalls('/api/v1/relay/servers/next')).toHaveLength(2);
        expect(getCalls('/api/v1/relay/requests')).toHaveLength(2);
    });

    test('timeout calls cancel when possible and returns a helpful error', async () => {
        await installRelayFetch({ retrieve202s: 999 });
        await expect(tokenPlaceChat([], { timeoutMs: 1, pollIntervalMs: 1 })).rejects.toMatchObject(
            { type: 'timeout' }
        );
        expect(getCalls('/api/v1/relay/requests/cancel')).toHaveLength(1);
    });

    test('decrypted envelope validation rejects unsafe mismatches', async () => {
        const valid = {
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: 1,
            request_id: 'req',
            client_public_key: 'client',
            api_v1_response: tokenPlacePayload(),
        };
        expect(() =>
            validateRelayResponseEnvelope(valid, { requestId: 'req', clientPublicKey: 'client' })
        ).not.toThrow();
        for (const patch of [
            { request_id: 'other' },
            { client_public_key: 'other' },
            { protocol: 'wrong' },
            { version: 2 },
            { api_v1_response: undefined },
        ]) {
            expect(() =>
                validateRelayResponseEnvelope(
                    { ...valid, ...patch },
                    { requestId: 'req', clientPublicKey: 'client' }
                )
            ).toThrow(/Malformed token\.place response/);
        }
    });

    test('normalizes raw PEM and base64 PEM server keys and supports crypto round-trip', async () => {
        const server = await createServerKeys();
        expect(normalizeRelayPublicKey(server.publicKeyPem).pem).toContain('BEGIN PUBLIC KEY');
        expect(normalizeRelayPublicKey(server.serverPublicKeyBase64).pem).toContain(
            'BEGIN PUBLIC KEY'
        );
        const client = await generateRelayClientKeyPair();
        const encrypted = await encryptRelayEnvelope({ ok: true }, client.publicKeyPem);
        await expect(decryptRelayEnvelope(encrypted, client.privateKey)).resolves.toEqual({
            ok: true,
        });
    });

    test('no available compute node, relay unavailable, and malformed encrypted responses classify safely', async () => {
        global.fetch = jest.fn(async (url) => {
            if (url.endsWith('/api/v1/relay/servers/next')) return okJson({ error: 'none' }, 404);
            throw new Error('unexpected');
        });
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ status: 404 });

        await installRelayFetch();
        fetch
            .mockImplementationOnce(async () =>
                okJson({ server_public_key: (await createServerKeys()).serverPublicKeyBase64 })
            )
            .mockImplementationOnce(async () => okJson({ error: 'down' }, 503));
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ status: 503 });

        const keys = await createServerKeys();
        global.fetch = jest.fn(async (url, init = {}) => {
            if (url.endsWith('/api/v1/relay/servers/next'))
                return okJson({ server_public_key: keys.serverPublicKeyBase64 });
            if (url.endsWith('/api/v1/relay/requests')) return okJson({ queued: true });
            if (url.endsWith('/api/v1/relay/responses/retrieve'))
                return okJson({ ciphertext: 'bad', cipherkey: 'bad', iv: 'bad' });
            throw new Error('unexpected');
        });
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ type: 'malformed' });
    });

    test('base URL/model compatibility helpers remain intact', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        expect(resolveTokenPlaceBaseUrl()).toBe('https://staging.token.place');
        expect(buildTokenPlaceChatCompletionsUrl('https://token.place/api')).toBe(
            'https://token.place/api/v1/chat/completions'
        );
        expect(getTokenPlaceChatModel()).toBe('llama-3.1-8b-instruct');
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'custom-model';
        expect(getTokenPlaceChatModel({ runtimeModel: 'runtime-model' })).toBe('runtime-model');
        expect(
            buildTokenPlaceMetadata({
                client: 'attacker',
                provider: 'openai',
                conversation_id: 'conv-42',
            })
        ).toEqual({
            conversation_id: 'conv-42',
            client: 'dspace',
            provider: 'token.place',
        });
    });

    test('parses assistant text and compatibility helper returns string shape', async () => {
        expect(extractTokenPlaceAssistantText({ choices: [{ message: { content: 'hi' } }] })).toBe(
            'hi'
        );
        await installRelayFetch();
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'mocked reply'
        );
    });

    test('richer helper returns text, DSPACE contextSources, usage, and metadata', async () => {
        await installRelayFetch();
        const dspaceSources = [{ title: 'DSPACE docs', url: '/docs/about' }];
        const result = await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [{ role: 'user', content: 'hello' }],
                contextSources: dspaceSources,
                gameState: {},
            },
        });
        expect(result).toEqual({
            text: 'mocked reply',
            contextSources: dspaceSources,
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            metadata: { client: 'dspace', provider: 'token.place' },
        });
    });

    test('abort errors classify safely', async () => {
        const abortError = new Error('The operation was aborted.');
        abortError.name = 'AbortError';
        global.fetch = jest.fn(() => Promise.reject(abortError));
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ type: 'abort' });
        expect(
            getTokenPlaceErrorSummary(await tokenPlaceChat([]).catch((error) => error)).message
        ).not.toMatch(/OpenAI/i);
    });

    test('shared prompt omits stale provider guidance before encrypted dispatch', async () => {
        await installRelayFetch();
        const promptPayload = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const serializedPrompt = JSON.stringify({
            combinedMessages: promptPayload.combinedMessages,
            debugMessages: promptPayload.debugMessages,
        });
        expect(serializedPrompt).not.toMatch(/token\.place is deferred/i);
        expect(serializedPrompt).not.toMatch(/chat uses OpenAI/i);
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], { promptPayload });
        expect(JSON.stringify(getRelayRequestBody())).not.toMatch(
            /token\.place is deferred|chat uses OpenAI/i
        );
    });
});
