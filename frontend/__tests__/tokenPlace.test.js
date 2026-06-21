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
    decryptTokenPlaceEnvelope,
    encryptTokenPlaceEnvelope,
    generateTokenPlaceClientKeypair,
    validateTokenPlaceResponseEnvelope,
    buildTokenPlaceChatCompletionsUrl,
    buildTokenPlaceMetadata,
    extractTokenPlaceAssistantText,
    getTokenPlaceChatModel,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
} = await import('../src/utils/tokenPlace.js');
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');
const { buildChatPrompt } = await import('../src/utils/openAI.js');

const okResponse = (body = {}) => ({
    ok: true,
    status: 200,
    json: () =>
        Promise.resolve({
            choices: [{ message: { content: 'mocked reply' } }],
            ...body,
        }),
});

const decodeBase64Text = (value) =>
    new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));
const decodeBase64Bytes = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

let relayServerKeys;
let relayReply = {
    choices: [{ message: { content: 'mocked reply' } }],
};

const makeRelayFetch = ({
    retrieveStatuses = [200],
    serverFailureOnce = false,
    accepted = true,
} = {}) => {
    let retrieveCount = 0;
    return jest.fn(async (url, init = {}) => {
        if (url.endsWith('/api/v1/relay/servers/next')) {
            const key =
                serverFailureOnce &&
                fetch.mock.calls.filter(([calledUrl]) =>
                    calledUrl.endsWith('/api/v1/relay/servers/next')
                ).length === 1
                    ? relayServerKeys[1]
                    : relayServerKeys[0];
            return {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ server_public_key: key.publicKeyBase64 }),
            };
        }
        if (url.endsWith('/api/v1/relay/requests')) {
            return { ok: true, status: 200, json: () => Promise.resolve({ accepted }) };
        }
        if (url.endsWith('/api/v1/relay/responses/retrieve')) {
            const status = retrieveStatuses[Math.min(retrieveCount, retrieveStatuses.length - 1)];
            retrieveCount += 1;
            if (status === 202) return { ok: false, status: 202, json: () => Promise.resolve({}) };
            if (status === 404 || status === 410)
                return { ok: false, status, json: () => Promise.resolve({ message: 'gone' }) };
            const body = JSON.parse(init.body);
            const clientPublicPem = decodeBase64Text(body.client_public_key);
            const encrypted = await encryptTokenPlaceEnvelope(
                {
                    protocol: 'tokenplace_api_v1_relay_e2ee',
                    version: 1,
                    request_id: body.request_id,
                    client_public_key: body.client_public_key,
                    api_v1_response: relayReply,
                },
                clientPublicPem
            );
            encrypted.chat_history = encrypted.ciphertext;
            return { ok: true, status: 200, json: () => Promise.resolve(encrypted) };
        }
        if (url.endsWith('/api/v1/relay/requests/cancel')) {
            return { ok: true, status: 200, json: () => Promise.resolve({ canceled: true }) };
        }
        throw new Error(`Unexpected fetch URL ${url}`);
    });
};

const getFetchCalls = () =>
    fetch.mock.calls.map(([url, init = {}]) => ({
        url,
        init,
        body: init.body ? JSON.parse(init.body) : undefined,
    }));
const getFetchCallByPath = (path) => getFetchCalls().find((call) => call.url.endsWith(path));

const getFetchCall = () => {
    const [url, init] = fetch.mock.calls[0];
    return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
};

describe('token.place API v1 client', () => {
    beforeEach(async () => {
        relayServerKeys = [
            await generateTokenPlaceClientKeypair(),
            await generateTokenPlaceClientKeypair(),
        ];
        relayReply = { choices: [{ message: { content: 'mocked reply' } }] };
        global.fetch = makeRelayFetch();
        loadGameState.mockReturnValue({});
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('fresh/default state uses token.place relay E2EE routes', async () => {
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCallByPath('/api/v1/relay/servers/next')?.init.method).toBe('GET');
        expect(getFetchCallByPath('/api/v1/relay/requests')?.init.method).toBe('POST');
        expect(getFetchCallByPath('/api/v1/relay/responses/retrieve')?.init.method).toBe('POST');
        expect(fetch.mock.calls.some(([url]) => url.endsWith('/api/v1/chat/completions'))).toBe(
            false
        );
    });

    test('legacy enabled flags do not disable default token.place chat', async () => {
        process.env.VITE_TOKEN_PLACE_ENABLED = 'false';
        loadGameState.mockReturnValue({ tokenPlace: { enabled: false } });

        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);

        const relayRequest = getFetchCallByPath('/api/v1/relay/requests');
        expect(relayRequest.init.method).toBe('POST');
        expect(relayRequest.init.credentials).toBe('omit');
        expect(relayRequest.init.headers?.Authorization).toBeUndefined();
        expect(JSON.stringify(relayRequest.body)).not.toContain('hello');
    });

    test('VITE_TOKEN_PLACE_URL staging override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCallByPath('/api/v1/relay/servers/next').url).toBe(
            'https://staging.token.place/api/v1/relay/servers/next'
        );
    });

    test('VITE_TOKEN_PLACE_URL production override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCallByPath('/api/v1/relay/servers/next').url).toBe(
            'https://token.place/api/v1/relay/servers/next'
        );
    });

    test('explicit url overrides state and runtime compatibility values', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            url: 'https://explicit.token.place/api/v1',
            runtimeUrl: 'https://runtime.token.place',
        });
        expect(getFetchCallByPath('/api/v1/relay/servers/next').url).toBe(
            'https://explicit.token.place/api/v1/relay/servers/next'
        );
    });

    test('state tokenPlace url compatibility override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCallByPath('/api/v1/relay/servers/next').url).toBe(
            'https://state.token.place/api/v1/relay/servers/next'
        );
    });

    test('runtime url is used before saved state and VITE fallback', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://saved.token.place/' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            runtimeUrl: 'https://staging.token.place/api',
        });
        expect(getFetchCallByPath('/api/v1/relay/servers/next').url).toBe(
            'https://staging.token.place/api/v1/relay/servers/next'
        );
    });

    test('legacy /api base normalizes without /api/api duplication', () => {
        expect(resolveTokenPlaceBaseUrl({ url: 'https://token.place/api' })).toBe(
            'https://token.place'
        );
        expect(buildTokenPlaceChatCompletionsUrl('https://token.place/api')).toBe(
            'https://token.place/api/v1/chat/completions'
        );
        expect(buildTokenPlaceChatCompletionsUrl('https://token.place/api')).not.toContain(
            '/api/api/v1/chat/completions'
        );
    });

    test('does not post to legacy token.place backend chat endpoints', async () => {
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).not.toMatch(/\/api\/chat$|\/chat$/);
    });

    test('uses default model and model override', async () => {
        expect(getTokenPlaceChatModel()).toBe('llama-3.1-8b-instruct');
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'custom-model';
        expect(getTokenPlaceChatModel()).toBe('custom-model');
        expect(getTokenPlaceChatModel({ runtimeModel: 'runtime-model' })).toBe('runtime-model');
        expect(
            getTokenPlaceChatModel({ model: 'explicit-model', runtimeModel: 'runtime-model' })
        ).toBe('explicit-model');
    });

    test('request is zero-auth and excludes secrets from headers/body/metadata', async () => {
        loadGameState.mockReturnValue({ openAI: { apiKey: 'sk-secret-openai-key' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            metadata: {
                conversation_id: 'conv-42',
                credential: 'credential-canary-alpha',
                authorization: 'authorization-canary-bravo',
                playerInventory: 'player-inventory-canary-charlie',
                rawSaveData: 'raw-save-data-canary-delta',
                secret: 'secret-canary-echo',
            },
        });
        const { init, body } = getFetchCallByPath('/api/v1/relay/requests');
        expect(init.headers.Authorization).toBeUndefined();
        expect(Object.keys(init.headers ?? {}).some((key) => /^authorization$/i.test(key))).toBe(
            false
        );
        expect(init.credentials).toBe('omit');
        const serialized = JSON.stringify({ headers: init.headers, body });
        expect(serialized).not.toContain('sk-secret-openai-key');
        expect(serialized).not.toContain('credential-canary-alpha');
        expect(serialized).not.toContain('authorization-canary-bravo');
        expect(serialized).not.toContain('player-inventory-canary-charlie');
        expect(serialized).not.toContain('raw-save-data-canary-delta');
        expect(serialized).not.toContain('secret-canary-echo');
        expect(body).not.toHaveProperty('metadata');
    });

    test('request body includes model, schema-safe messages, safe metadata, and no true stream', async () => {
        await TokenPlaceChatV2([
            {
                role: 'developer',
                content: 'hello',
                id: 'ui-message-id',
                timestamp: 123,
                tokens: 1,
                avatar: 'pilot.png',
            },
        ]);
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
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
        expect(decodeBase64Bytes(body.iv)).toHaveLength(16);
        expect(body).not.toHaveProperty('mode');
        expect(body).not.toHaveProperty('tag');
        expect(JSON.stringify(body)).not.toContain('hello');
        expect(JSON.stringify(body)).not.toContain('model');
        expect(body.stream).not.toBe(true);
    });

    test('decrypt accepts token.place CBC response ciphertext from chat_history or ciphertext', async () => {
        const envelope = {
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: 1,
            request_id: 'request-cbc',
            client_public_key: relayServerKeys[0].publicKeyBase64,
            api_v1_response: { choices: [{ message: { content: 'cbc reply' } }] },
        };
        const encrypted = await encryptTokenPlaceEnvelope(
            envelope,
            relayServerKeys[0].publicKeyPem
        );

        await expect(
            decryptTokenPlaceEnvelope(
                { ...encrypted, chat_history: encrypted.ciphertext },
                relayServerKeys[0].privateKey
            )
        ).resolves.toEqual(envelope);

        const { chat_history: _chatHistory, ...ciphertextOnly } = {
            ...encrypted,
            chat_history: encrypted.ciphertext,
        };
        await expect(
            decryptTokenPlaceEnvelope(ciphertextOnly, relayServerKeys[0].privateKey)
        ).resolves.toEqual(envelope);
    });

    test('decrypted API v1 request nests metadata under options', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            metadata: { conversation_id: 'conv-42' },
        });
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);

        expect(decrypted.api_v1_request).toEqual(
            expect.objectContaining({
                model: 'llama-3.1-8b-instruct',
                messages: expect.any(Array),
                options: {
                    metadata: {
                        conversation_id: 'conv-42',
                        client: 'dspace',
                        provider: 'token.place',
                    },
                },
            })
        );
        expect(decrypted.api_v1_request).not.toHaveProperty('metadata');
    });

    test('large encrypted envelopes do not overflow base64 conversion', async () => {
        await expect(
            TokenPlaceChatV2([], {
                promptPayload: {
                    combinedMessages: [{ role: 'system', content: 'x'.repeat(100_000) }],
                    contextSources: [],
                    gameState: {},
                },
            })
        ).resolves.toMatchObject({ text: 'mocked reply' });
    });

    test('safe metadata preserves trusted client and provider fields', () => {
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

    test('parses assistant text and compatibility helper returns string', async () => {
        expect(extractTokenPlaceAssistantText({ choices: [{ message: { content: 'hi' } }] })).toBe(
            'hi'
        );
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'mocked reply'
        );
    });

    test('richer helper returns text, DSPACE contextSources, usage, and metadata', async () => {
        relayReply = {
            choices: [{ message: { content: 'mocked reply' } }],
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
            contextSources: [{ title: 'provider field should not be used' }],
        };
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
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
        });
    });

    test('passes abort signal to fetch', async () => {
        const controller = new AbortController();
        await tokenPlaceChat([], { signal: controller.signal });
        expect(getFetchCall().init.signal).toBe(controller.signal);
    });

    test('malformed responses throw and classify safely', async () => {
        fetch.mockResolvedValueOnce(okResponse({ choices: [{ message: { content: '' } }] }));
        let thrownError;
        try {
            await tokenPlaceChat([]);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toMatchObject({ type: 'malformed' });
        const summary = getTokenPlaceErrorSummary(thrownError);
        expect(summary.type).toBe('malformed');
        expect(summary.message).toBe(
            'token.place returned an unexpected response. Please try again shortly.'
        );
        expect(summary.message).not.toMatch(/OpenAI/i);
    });

    test('structured API errors produce expected summaries', async () => {
        const cases = [
            [
                400,
                {
                    error: {
                        message: 'blocked',
                        type: 'content_policy_violation',
                        code: 'content_blocked',
                    },
                },
                'content_policy',
            ],
            [429, { error: { message: 'slow down', type: 'rate_limit' } }, 'rate_limit'],
            [503, { error: { message: 'unavailable', type: 'server_error' } }, 'server'],
            [
                400,
                {
                    error: {
                        message: 'stream true rejected',
                        type: 'invalid_request_error',
                        param: 'stream',
                    },
                },
                'validation',
            ],
            [400, { error: { message: 'bad model', type: 'invalid_request_error' } }, 'provider'],
        ];

        for (const [status, payload, expectedType] of cases) {
            fetch.mockResolvedValueOnce({
                ok: false,
                status,
                statusText: 'Bad Request',
                json: () => Promise.resolve(payload),
            });
            try {
                await tokenPlaceChat([]);
            } catch (error) {
                expect(getTokenPlaceErrorSummary(error).type).toBe(expectedType);
                expect(getTokenPlaceErrorSummary(error).message).not.toMatch(/OpenAI/i);
            }
        }
    });

    test('decrypted content policy errors surface as structured provider errors', async () => {
        relayReply = {
            error: {
                message: 'blocked by policy',
                type: 'content_policy_violation',
                code: 'content_blocked',
                param: 'messages',
            },
        };

        let thrownError;
        try {
            await tokenPlaceChat([{ role: 'user', content: 'blocked prompt' }]);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toMatchObject({
            type: 'content_policy',
            status: 400,
            code: 'content_blocked',
            param: 'messages',
            providerMessage: 'blocked by policy',
        });
        expect(thrownError.message).toBe('token.place API v1 request failed: blocked by policy');
        expect(thrownError.message).not.toMatch(/missing assistant content/i);
        expect(getTokenPlaceErrorSummary(thrownError).type).toBe('content_policy');
    });

    test('decrypted status-bearing API errors preserve status, code, and message', async () => {
        relayReply = {
            status_code: 429,
            error: {
                message: 'too many requests',
                type: 'rate_limit',
                code: 'rate_limit_exceeded',
            },
        };

        let thrownError;
        try {
            await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toMatchObject({
            type: 'rate_limit',
            status: 429,
            code: 'rate_limit_exceeded',
            providerMessage: 'too many requests',
        });
        expect(thrownError.message).toBe('token.place API v1 request failed: too many requests');
        expect(thrownError.message).not.toMatch(/missing assistant content/i);
        expect(getTokenPlaceErrorSummary(thrownError).type).toBe('rate_limit');
    });

    test('decrypted responses missing choices and error remain malformed', async () => {
        relayReply = { usage: { prompt_tokens: 1 } };

        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'malformed',
            message: 'Malformed token.place response: missing assistant content.',
        });
    });

    test('network errors classify safely', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ type: 'network' });
    });

    test('unexpected fetch errors classify safely', async () => {
        fetch.mockRejectedValueOnce(new Error('Unexpected token.place failure'));

        let thrownError;
        try {
            await tokenPlaceChat([]);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toMatchObject({ type: 'unknown' });
        const summary = getTokenPlaceErrorSummary(thrownError);
        expect(summary).toEqual({
            type: 'unknown',
            message: 'token.place hit an unexpected error. Please try again shortly.',
        });
        expect(summary.message).not.toMatch(/OpenAI/i);
    });

    test('abort errors classify safely', async () => {
        const abortError = new Error('The operation was aborted.');
        abortError.name = 'AbortError';
        fetch.mockRejectedValueOnce(abortError);

        let thrownError;
        try {
            await tokenPlaceChat([]);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toMatchObject({ type: 'abort' });
        const summary = getTokenPlaceErrorSummary(thrownError);
        expect(summary).toEqual({
            type: 'abort',
            message: 'The token.place request was canceled. Please try again.',
        });
        expect(summary.message).not.toMatch(/OpenAI/i);
    });

    test('relay request body is ciphertext-only for prompt and game-state sentinels', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'PLAYERSTATE_SECRET_SENTINEL' }], {
            promptPayload: {
                combinedMessages: [
                    { role: 'system', content: 'DOCS_GROUNDING_SECRET_SENTINEL' },
                    {
                        role: 'user',
                        content: 'PLAYERSTATE_SECRET_SENTINEL INVENTORY_SAVE_SECRET_SENTINEL',
                    },
                ],
                contextSources: [],
                gameState: {},
            },
        });

        const serialized = JSON.stringify(getFetchCallByPath('/api/v1/relay/requests').body);
        expect(serialized).not.toContain('PLAYERSTATE_SECRET_SENTINEL');
        expect(serialized).not.toContain('DOCS_GROUNDING_SECRET_SENTINEL');
        expect(serialized).not.toContain('INVENTORY_SAVE_SECRET_SENTINEL');
        expect(serialized).not.toContain('messages');
    });

    test('HTTP 202 retrieve polling continues until final response', async () => {
        global.fetch = makeRelayFetch({ retrieveStatuses: [202, 202, 200] });
        await expect(
            tokenPlaceChat([{ role: 'user', content: 'hello' }], { pollIntervalMs: 1 })
        ).resolves.toBe('mocked reply');
        const retrieveCalls = fetch.mock.calls.filter(([url]) =>
            url.endsWith('/api/v1/relay/responses/retrieve')
        );
        expect(retrieveCalls).toHaveLength(3);
    });

    test('terminal selected-server failure clears selected server and can reselect', async () => {
        global.fetch = makeRelayFetch({ retrieveStatuses: [410, 200], serverFailureOnce: true });
        await expect(
            tokenPlaceChat([{ role: 'user', content: 'hello' }], { pollIntervalMs: 1 })
        ).resolves.toBe('mocked reply');
        const serverSelections = fetch.mock.calls.filter(([url]) =>
            url.endsWith('/api/v1/relay/servers/next')
        );
        const dispatches = fetch.mock.calls.filter(([url]) =>
            url.endsWith('/api/v1/relay/requests')
        );
        expect(serverSelections).toHaveLength(2);
        expect(dispatches).toHaveLength(2);
    });

    test('timeout calls cancel when possible and returns helpful error', async () => {
        global.fetch = makeRelayFetch({ retrieveStatuses: [202] });
        await expect(
            tokenPlaceChat([{ role: 'user', content: 'hello' }], {
                timeoutMs: 1,
                pollIntervalMs: 1,
            })
        ).rejects.toMatchObject({ status: 408 });
        expect(
            fetch.mock.calls.some(([url]) => url.endsWith('/api/v1/relay/requests/cancel'))
        ).toBe(true);
    });

    test('relay accepted false fast-fails before polling', async () => {
        global.fetch = makeRelayFetch({ accepted: false });

        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'malformed',
            message: 'token.place relay rejected the request.',
        });
        expect(
            fetch.mock.calls.some(([url]) => url.endsWith('/api/v1/relay/responses/retrieve'))
        ).toBe(false);
    });

    test('decrypted envelope validation rejects unsafe/mismatched shapes', () => {
        const base = {
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: 1,
            request_id: 'request-1',
            client_public_key: 'client-key',
            api_v1_response: { choices: [{ message: { content: 'ok' } }] },
        };
        const expected = { requestId: 'request-1', clientPublicKey: 'client-key' };
        expect(validateTokenPlaceResponseEnvelope(base, expected)).toBe(base.api_v1_response);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...base, request_id: 'other' }, expected)
        ).toThrow(/mismatched request id/i);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...base, client_public_key: 'other' }, expected)
        ).toThrow(/mismatched client key/i);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...base, protocol: 'wrong' }, expected)
        ).toThrow(/wrong protocol/i);
        expect(() => validateTokenPlaceResponseEnvelope({ ...base, version: 2 }, expected)).toThrow(
            /wrong version/i
        );
        const { api_v1_response: _apiV1Response, ...missingResponse } = base;
        expect(() => validateTokenPlaceResponseEnvelope(missingResponse, expected)).toThrow(
            /missing API response/i
        );
    });

    test('no available compute node, relay unavailable, malformed encrypted response, and disconnected server classify safely', async () => {
        global.fetch = jest.fn(async (url) => {
            if (url.endsWith('/api/v1/relay/servers/next')) {
                return { ok: true, status: 200, json: () => Promise.resolve({}) };
            }
            throw new Error(`Unexpected URL ${url}`);
        });
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ type: 'malformed' });

        global.fetch = jest.fn(async (url) => {
            if (url.endsWith('/api/v1/relay/servers/next')) {
                return {
                    ok: false,
                    status: 503,
                    statusText: 'Unavailable',
                    json: () => Promise.resolve({ message: 'down' }),
                };
            }
            throw new Error(`Unexpected URL ${url}`);
        });
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ status: 503 });

        global.fetch = jest.fn(async (url, init = {}) => {
            if (url.endsWith('/api/v1/relay/servers/next')) {
                return {
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({ server_public_key: relayServerKeys[0].publicKeyBase64 }),
                };
            }
            if (url.endsWith('/api/v1/relay/requests')) {
                return { ok: true, status: 200, json: () => Promise.resolve({ accepted: true }) };
            }
            if (url.endsWith('/api/v1/relay/responses/retrieve')) {
                return {
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ ciphertext: 'bad', cipherkey: 'bad', iv: 'bad' }),
                };
            }
            throw new Error(`Unexpected URL ${url} ${init.method}`);
        });
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ type: 'malformed' });

        global.fetch = makeRelayFetch({ retrieveStatuses: [404, 404] });
        await expect(tokenPlaceChat([], { pollIntervalMs: 1 })).rejects.toMatchObject({
            type: 'malformed',
            message: 'No token.place compute node is available.',
        });
    });

    test('shared prompt and token.place payload omit stale provider guidance', async () => {
        const promptPayload = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const serializedPrompt = JSON.stringify({
            combinedMessages: promptPayload.combinedMessages,
            debugMessages: promptPayload.debugMessages,
        });

        expect(serializedPrompt).not.toMatch(/token\.place is deferred/i);
        expect(serializedPrompt).not.toMatch(/chat uses OpenAI/i);

        await tokenPlaceChat([{ role: 'user', content: 'hello' }], { promptPayload });
        const serializedRequest = JSON.stringify(getFetchCallByPath('/api/v1/relay/requests').body);
        expect(serializedRequest).not.toMatch(/token\.place is deferred/i);
        expect(serializedRequest).not.toMatch(/chat uses OpenAI/i);
    });
});
