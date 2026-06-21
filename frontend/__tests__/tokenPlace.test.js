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
    extractTokenPlaceAssistantText,
    getTokenPlaceChatModel,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
    validateTokenPlaceRelayResponseEnvelope,
} = await import('../src/utils/tokenPlace.js');
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');
const { buildChatPrompt } = await import('../src/utils/openAI.js');

const SERVER_KEY = 'U0VSVkVSX1BVQkxJQ19LRVk=';
const CLIENT_KEY = 'Q0xJRU5UX1BVQkxJQ19LRVk=';

const okResponse = (body = {}, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 202 ? 'Accepted' : 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
});

const errorResponse = (status, body = { error: { message: 'failed' } }) => ({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
});

const relayOptions = (overrides = {}) => ({
    requestId: 'request-1',
    cancelToken: 'cancel-1',
    pollIntervalMs: 1,
    timeoutMs: 25,
    generateClientKeyPair: async () => ({ publicKeyBase64: CLIENT_KEY, privateKey: 'private-key' }),
    encryptEnvelope: async () => ({ ciphertext: 'ciphertext', cipherkey: 'cipherkey', iv: 'iv' }),
    decryptEnvelope: async () => ({
        protocol: 'tokenplace_api_v1_relay_e2ee',
        version: 1,
        request_id: 'request-1',
        client_public_key: CLIENT_KEY,
        api_v1_response: {
            choices: [{ message: { content: 'mocked reply' } }],
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
        },
    }),
    ...overrides,
});

const installRelayFetch = (
    retrieveResponses = [okResponse({ ciphertext: 'response', cipherkey: 'key', iv: 'iv' })]
) => {
    fetch.mockImplementation(async (url) => {
        if (String(url).endsWith('/api/v1/relay/servers/next')) {
            return okResponse({ server_public_key: SERVER_KEY });
        }
        if (String(url).endsWith('/api/v1/relay/requests')) {
            return okResponse({ accepted: true });
        }
        if (String(url).endsWith('/api/v1/relay/responses/retrieve')) {
            return retrieveResponses.shift() || okResponse({}, 202);
        }
        if (String(url).endsWith('/api/v1/relay/requests/cancel')) {
            return okResponse({ canceled: true });
        }
        return errorResponse(500);
    });
};

const getFetchCall = (index = 0) => {
    const [url, init = {}] = fetch.mock.calls[index];
    return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
};

const findFetchCall = (path) => {
    const index = fetch.mock.calls.findIndex(([url]) => String(url).endsWith(path));
    return index >= 0 ? getFetchCall(index) : undefined;
};

const calledUrls = () => fetch.mock.calls.map(([url]) => String(url));

describe('token.place API v1 relay E2EE client', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        installRelayFetch();
        loadGameState.mockReturnValue({});
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('default token.place flow uses relay routes instead of plaintext chat completions', async () => {
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], relayOptions());

        expect(calledUrls()).toEqual([
            'https://token.place/api/v1/relay/servers/next',
            'https://token.place/api/v1/relay/requests',
            'https://token.place/api/v1/relay/responses/retrieve',
        ]);
        expect(calledUrls().some((url) => url.endsWith('/api/v1/chat/completions'))).toBe(false);
    });

    test('relay request body contains only safe routing metadata and ciphertext fields', async () => {
        await TokenPlaceChatV2(
            [{ role: 'user', content: 'PLAYERSTATE_SECRET_SENTINEL hello' }],
            relayOptions({
                promptPayload: {
                    combinedMessages: [
                        { role: 'system', content: 'DOCS_GROUNDING_SECRET_SENTINEL PlayerState' },
                        {
                            role: 'user',
                            content: 'PLAYERSTATE_SECRET_SENTINEL inventory save state',
                        },
                    ],
                    contextSources: [],
                    gameState: {},
                },
            })
        );

        const { init, body } = findFetchCall('/api/v1/relay/requests');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('omit');
        expect(init.headers.Authorization).toBeUndefined();
        expect(body).toEqual({
            server_public_key: SERVER_KEY,
            client_public_key: CLIENT_KEY,
            request_id: 'request-1',
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: 1,
            ciphertext: 'ciphertext',
            cipherkey: 'cipherkey',
            iv: 'iv',
            cancel_token: 'cancel-1',
        });
        const serializedOuter = JSON.stringify(body);
        expect(serializedOuter).not.toContain('PLAYERSTATE_SECRET_SENTINEL');
        expect(serializedOuter).not.toContain('DOCS_GROUNDING_SECRET_SENTINEL');
        expect(serializedOuter).not.toContain('inventory save state');
        expect(serializedOuter).not.toContain('PlayerState');
    });

    test('HTTP 202 retrieve polling continues until a final encrypted response', async () => {
        installRelayFetch([
            okResponse({ pending: true }, 202),
            okResponse({ pending: true }, 202),
            okResponse({ ciphertext: 'response', cipherkey: 'key', iv: 'iv' }),
        ]);

        await expect(tokenPlaceChat([], relayOptions())).resolves.toBe('mocked reply');
        expect(
            calledUrls().filter((url) => url.endsWith('/api/v1/relay/responses/retrieve'))
        ).toHaveLength(3);
    });

    test('terminal selected-server failure clears selected server and can reselect another node', async () => {
        let serverCalls = 0;
        fetch.mockImplementation(async (url) => {
            if (String(url).endsWith('/api/v1/relay/servers/next')) {
                serverCalls += 1;
                return okResponse({ server_public_key: SERVER_KEY });
            }
            if (String(url).endsWith('/api/v1/relay/requests') && serverCalls === 1) {
                return errorResponse(410, { error: { message: 'selected server disconnected' } });
            }
            if (String(url).endsWith('/api/v1/relay/requests'))
                return okResponse({ accepted: true });
            if (String(url).endsWith('/api/v1/relay/responses/retrieve')) {
                return okResponse({ ciphertext: 'response', cipherkey: 'key', iv: 'iv' });
            }
            return errorResponse(500);
        });

        await expect(tokenPlaceChat([], relayOptions())).resolves.toBe('mocked reply');
        expect(serverCalls).toBe(2);
        expect(calledUrls().filter((url) => url.endsWith('/api/v1/relay/requests'))).toHaveLength(
            2
        );
    });

    test('timeout calls cancel when possible and returns a helpful error', async () => {
        installRelayFetch([okResponse({ pending: true }, 202)]);

        await expect(tokenPlaceChat([], relayOptions({ timeoutMs: 1 }))).rejects.toMatchObject({
            status: 408,
        });
        expect(findFetchCall('/api/v1/relay/requests/cancel').body).toEqual({
            cancel_token: 'cancel-1',
        });
    });

    test('decrypted envelope validation rejects mismatched or malformed response envelopes', () => {
        const valid = {
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: 1,
            request_id: 'request-1',
            client_public_key: CLIENT_KEY,
            api_v1_response: { choices: [{ message: { content: 'ok' } }] },
        };
        const expected = { requestId: 'request-1', clientPublicKey: CLIENT_KEY };
        expect(validateTokenPlaceRelayResponseEnvelope(valid, expected)).toBe(
            valid.api_v1_response
        );
        for (const patch of [
            { request_id: 'wrong' },
            { client_public_key: 'wrong' },
            { protocol: 'wrong' },
            { version: 2 },
            { api_v1_response: undefined },
        ]) {
            expect(() =>
                validateTokenPlaceRelayResponseEnvelope({ ...valid, ...patch }, expected)
            ).toThrow(/Malformed token.place relay response/);
        }
    });

    test('base URL and model compatibility helpers remain intact', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'custom-model';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], relayOptions());
        expect(getFetchCall().url).toBe('https://staging.token.place/api/v1/relay/servers/next');
        expect(getTokenPlaceChatModel()).toBe('custom-model');
        expect(buildTokenPlaceChatCompletionsUrl('https://token.place/api')).toBe(
            'https://token.place/api/v1/chat/completions'
        );
        expect(resolveTokenPlaceBaseUrl({ url: 'https://token.place/api/v1' })).toBe(
            'https://token.place'
        );
    });

    test('request is zero-auth and excludes secrets from outer relay payload', async () => {
        loadGameState.mockReturnValue({ openAI: { apiKey: 'sk-secret-openai-key' } });
        await TokenPlaceChatV2(
            [{ role: 'user', content: 'hello' }],
            relayOptions({
                metadata: {
                    conversation_id: 'conv-42',
                    credential: 'credential-canary-alpha',
                    authorization: 'authorization-canary-bravo',
                    playerInventory: 'player-inventory-canary-charlie',
                    rawSaveData: 'raw-save-data-canary-delta',
                    secret: 'secret-canary-echo',
                },
            })
        );

        const { init, body } = findFetchCall('/api/v1/relay/requests');
        const serialized = JSON.stringify({ headers: init.headers, body });
        expect(init.credentials).toBe('omit');
        expect(init.headers.Authorization).toBeUndefined();
        expect(serialized).not.toContain('sk-secret-openai-key');
        expect(serialized).not.toContain('credential-canary-alpha');
        expect(serialized).not.toContain('authorization-canary-bravo');
        expect(serialized).not.toContain('player-inventory-canary-charlie');
        expect(serialized).not.toContain('raw-save-data-canary-delta');
        expect(serialized).not.toContain('secret-canary-echo');
    });

    test('safe metadata preserves trusted client and provider fields inside encrypted request only', () => {
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

    test('parses assistant text and richer helper returns DSPACE contextSources, usage, and metadata', async () => {
        expect(extractTokenPlaceAssistantText({ choices: [{ message: { content: 'hi' } }] })).toBe(
            'hi'
        );
        const dspaceSources = [{ title: 'DSPACE docs', url: '/docs/about' }];
        await expect(
            TokenPlaceChatV2(
                [],
                relayOptions({
                    promptPayload: {
                        combinedMessages: [{ role: 'user', content: 'hello' }],
                        contextSources: dspaceSources,
                        gameState: {},
                    },
                })
            )
        ).resolves.toEqual({
            text: 'mocked reply',
            contextSources: dspaceSources,
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
        });
    });

    test('passes abort signal to fetch', async () => {
        const controller = new AbortController();
        await tokenPlaceChat([], relayOptions({ signal: controller.signal }));
        expect(getFetchCall().init.signal).toBe(controller.signal);
    });

    test('malformed, network, no-node, relay unavailable, and selected-server errors classify safely', async () => {
        await expect(
            tokenPlaceChat([], relayOptions({ decryptEnvelope: async () => ({ malformed: true }) }))
        ).rejects.toMatchObject({ type: 'malformed' });

        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        await expect(tokenPlaceChat([], relayOptions())).rejects.toMatchObject({ type: 'network' });

        fetch.mockReset();
        fetch.mockResolvedValueOnce(errorResponse(404, { error: { message: 'no compute nodes' } }));
        await expect(
            tokenPlaceChat([], relayOptions({ maxServerAttempts: 1 }))
        ).rejects.toMatchObject({
            status: 404,
        });

        fetch.mockReset();
        fetch.mockResolvedValueOnce(errorResponse(503, { error: { message: 'unavailable' } }));
        await expect(tokenPlaceChat([], relayOptions())).rejects.toMatchObject({ type: 'server' });

        expect(getTokenPlaceErrorSummary({ type: 'malformed' }).message).not.toMatch(/OpenAI/i);
    });

    test('shared prompt and token.place payload omit stale provider guidance', async () => {
        const promptPayload = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const serializedPrompt = JSON.stringify({
            combinedMessages: promptPayload.combinedMessages,
            debugMessages: promptPayload.debugMessages,
        });

        expect(serializedPrompt).not.toMatch(/token\.place is deferred/i);
        expect(serializedPrompt).not.toMatch(/chat uses OpenAI/i);

        let encryptedEnvelope;
        await tokenPlaceChat(
            [{ role: 'user', content: 'hello' }],
            relayOptions({
                promptPayload,
                encryptEnvelope: async (envelope) => {
                    encryptedEnvelope = envelope;
                    return { ciphertext: 'ciphertext', cipherkey: 'cipherkey', iv: 'iv' };
                },
            })
        );
        expect(JSON.stringify(encryptedEnvelope.api_v1_request.messages)).not.toMatch(
            /token\.place is deferred|chat uses OpenAI/i
        );
    });
});
