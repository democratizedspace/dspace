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
const { searchDocsRag } = await import('../src/utils/docsRag.js');
const {
    TokenPlaceChatV2,
    decryptTokenPlaceEnvelope,
    encryptTokenPlaceEnvelope,
    generateTokenPlaceClientKeypair,
    validateTokenPlaceResponseEnvelope,
    buildTokenPlaceChatCompletionsUrl,
    extractTokenPlaceAssistantText,
    getTokenPlaceChatModel,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
} = await import('../src/utils/tokenPlace.js');
const { JSEncrypt } = await import('jsencrypt');
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

const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

const decodeBase64Text = (value) =>
    new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));

let relayServerKeys;
let relayReply = {
    choices: [{ message: { content: 'mocked reply' } }],
};

const urlPathEndsWith = (url, path) => new URL(url).pathname.endsWith(path);

const makeRelayFetch = ({
    retrieveStatuses = [200],
    serverFailureOnce = false,
    accepted = true,
    omitSelectedTier = false,
    selectedTier = ({ url }) => new URL(url).searchParams.get('context_tier') || '8k-fast',
    selectedWindowTokens,
    selectedModelSupport,
    replyForRetrieve = null,
} = {}) => {
    let retrieveCount = 0;
    let selectionCount = 0;
    return jest.fn(async (url, init = {}) => {
        if (urlPathEndsWith(url, '/api/v1/relay/servers/next')) {
            selectionCount += 1;
            const key =
                serverFailureOnce &&
                fetch.mock.calls.filter(([calledUrl]) =>
                    urlPathEndsWith(calledUrl, '/api/v1/relay/servers/next')
                ).length === 1
                    ? relayServerKeys[1]
                    : relayServerKeys[0];
            const tier = omitSelectedTier
                ? undefined
                : typeof selectedTier === 'function'
                  ? selectedTier({ url, selectionCount })
                  : selectedTier;
            return {
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        server_public_key: key.publicKeyBase64,
                        ...(tier ? { context_tier: tier } : {}),
                        ...(selectedWindowTokens
                            ? { selected_context_window_tokens: selectedWindowTokens }
                            : {}),
                        ...(selectedModelSupport
                            ? { selected_model_support: selectedModelSupport }
                            : {}),
                        selected_profile_id: 'test-8k',
                    }),
            };
        }
        if (urlPathEndsWith(url, '/api/v1/relay/requests')) {
            return { ok: true, status: 200, json: () => Promise.resolve({ accepted }) };
        }
        if (urlPathEndsWith(url, '/api/v1/relay/responses/retrieve')) {
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
                    api_v1_response: replyForRetrieve
                        ? replyForRetrieve({ requestBody: body })
                        : relayReply,
                },
                clientPublicPem
            );
            return {
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ...encrypted, chat_history: encrypted.ciphertext }),
            };
        }
        if (urlPathEndsWith(url, '/api/v1/relay/requests/cancel')) {
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
const getFetchCallByPath = (path) =>
    getFetchCalls().find((call) => urlPathEndsWith(call.url, path));

const getFetchCall = () => {
    const [url, init] = fetch.mock.calls[0];
    return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
};

const decryptFirstRelayRequest = async (serverKeyIndex = 0) => {
    const { body } = getFetchCallByPath('/api/v1/relay/requests');
    return decryptTokenPlaceEnvelope(body, relayServerKeys[serverKeyIndex].privateKey);
};

const expectValidApiV1Messages = (messages) => {
    expect(messages.length).toBeLessThanOrEqual(64);
    expect(
        messages.every((message) => ['system', 'user', 'assistant'].includes(message.role))
    ).toBe(true);
    expect(
        messages.every((message) => Object.keys(message).sort().join(',') === 'content,role')
    ).toBe(true);
    expect(
        messages.every((message) => typeof message.content === 'string' && message.content.trim())
    ).toBe(true);
    expect(messages.every((message) => message.content.length <= 32_768)).toBe(true);
    expect(
        messages.reduce((total, message) => total + message.content.length, 0)
    ).toBeLessThanOrEqual(131_072);
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
        searchDocsRag.mockResolvedValue({ excerptsText: '', sources: [] });
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
        expect(
            fetch.mock.calls.some(([url]) => urlPathEndsWith(url, '/api/v1/chat/completions'))
        ).toBe(false);
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
        expect(
            new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).origin +
                new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).pathname
        ).toBe('https://staging.token.place/api/v1/relay/servers/next');
    });

    test('VITE_TOKEN_PLACE_URL production override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(
            new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).origin +
                new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).pathname
        ).toBe('https://token.place/api/v1/relay/servers/next');
    });

    test('explicit url overrides state and runtime compatibility values', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            url: 'https://explicit.token.place/api/v1',
            runtimeUrl: 'https://runtime.token.place',
        });
        expect(
            new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).origin +
                new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).pathname
        ).toBe('https://explicit.token.place/api/v1/relay/servers/next');
    });

    test('state tokenPlace url compatibility override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(
            new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).origin +
                new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).pathname
        ).toBe('https://state.token.place/api/v1/relay/servers/next');
    });

    test('runtime url is used before saved state and VITE fallback', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://saved.token.place/' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            runtimeUrl: 'https://staging.token.place/api',
        });
        expect(
            new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).origin +
                new URL(getFetchCallByPath('/api/v1/relay/servers/next').url).pathname
        ).toBe('https://staging.token.place/api/v1/relay/servers/next');
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
        expect(serialized).not.toContain('conv-42');
        expect(serialized).not.toContain('conversation_id');
        expect(serialized).not.toContain('metadata');
        expect(body).not.toHaveProperty('metadata');
    });

    test('relay request body stays ciphertext-only and does not request streaming', async () => {
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
        expect(JSON.stringify(body)).not.toContain('hello');
        expect(JSON.stringify(body)).not.toContain('model');
        expect(decodeBase64Text(body.client_public_key)).toMatch(/^-----BEGIN PUBLIC KEY-----/);
        expect(Uint8Array.from(atob(body.iv), (char) => char.charCodeAt(0))).toHaveLength(16);
        expect(body).not.toHaveProperty('mode');
        expect(body).not.toHaveProperty('tag');
        expect(body.stream).not.toBe(true);
    });

    test('decrypted API v1 request uses empty options and excludes metadata', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            metadata: { conversation_id: 'conv-42' },
        });
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);

        expect(decrypted.api_v1_request).toEqual(
            expect.objectContaining({
                model: 'llama-3.1-8b-instruct',
                messages: expect.any(Array),
                options: {},
            })
        );
        expect(decrypted.api_v1_request).not.toHaveProperty('metadata');
        expect(decrypted.api_v1_request.options).not.toHaveProperty('metadata');
        expect(JSON.stringify(body)).not.toContain('conv-42');
        expect(JSON.stringify(body)).not.toContain('conversation_id');
        expect(JSON.stringify(body)).not.toContain('metadata');
    });

    test('default token.place mode uses the full dChat prompt path without docs for player-state-only questions', async () => {
        loadGameState.mockReturnValue({
            settings: { tokenPlaceTokenLite: false },
            inventory: [{ id: 'solar-panel', quantity: 1 }],
        });
        searchDocsRag.mockResolvedValue({
            excerptsText: 'RAG excerpt canary for normal mode.',
            sources: [{ title: 'DSPACE docs', url: '/docs/about' }],
        });

        await TokenPlaceChatV2([{ role: 'user', content: 'What should I build next?' }]);

        expect(searchDocsRag).not.toHaveBeenCalled();
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        // Verify full path produces more messages than token-lite's fixed [system, user] pair.
        expect(decrypted.api_v1_request.messages.length).toBeGreaterThan(2);
    });

    test('default token.place mode includes docs RAG for route questions', async () => {
        loadGameState.mockReturnValue({
            settings: { tokenPlaceTokenLite: false },
            inventory: [{ id: 'solar-panel', quantity: 1 }],
        });
        searchDocsRag.mockResolvedValue({
            excerptsText: 'Docs grounding: gamesave import route.',
            sources: [{ type: 'doc', id: '/docs/backups', label: 'Backups', url: '/docs/backups' }],
        });

        await TokenPlaceChatV2([{ role: 'user', content: 'where do I import a gamesave?' }]);

        expect(searchDocsRag).toHaveBeenCalledTimes(1);
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        expect(JSON.stringify(decrypted.api_v1_request.messages)).toContain('Docs grounding');
    });

    test('token-lite setting sends a tiny decrypted API v1 message set', async () => {
        loadGameState.mockReturnValue({
            settings: { tokenPlaceTokenLite: true },
            inventory: [{ id: 'player-state-canary', quantity: 99 }],
        });
        searchDocsRag.mockResolvedValue({
            excerptsText: 'RAG excerpt should not appear.',
            sources: [{ title: 'Should not appear', url: '/docs/solar' }],
        });

        await TokenPlaceChatV2([
            { role: 'user', content: 'old user history should not appear' },
            { role: 'assistant', content: 'older assistant history should not appear' },
            { role: 'user', content: 'latest token-lite user text' },
        ]);

        expect(searchDocsRag).not.toHaveBeenCalled();
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        const messages = decrypted.api_v1_request.messages;
        const serializedMessages = JSON.stringify(messages);

        expect(decrypted.api_v1_request.options).toEqual({});
        expect(messages).toEqual([
            {
                role: 'system',
                content:
                    "You are dChat, a concise DSPACE assistant. Answer the user's message. If game-specific context is missing, say you do not know.",
            },
            { role: 'user', content: 'latest token-lite user text' },
        ]);
        expect(messages).toHaveLength(2);
        expect(messages.reduce((total, message) => total + message.content.length, 0)).toBeLessThan(
            400
        );
        expect(serializedMessages).not.toContain('RAG excerpt should not appear');
        expect(serializedMessages).not.toContain('DSPACE knowledge base');
        expect(serializedMessages).not.toContain('PlayerState');
        expect(serializedMessages).not.toContain('player-state-canary');
        expect(serializedMessages).not.toContain('old user history should not appear');
        expect(serializedMessages).not.toContain('older assistant history should not appear');
        expect(JSON.stringify(body)).not.toContain('latest token-lite user text');
        expect(Object.keys(body)).not.toEqual(expect.arrayContaining(['messages', 'model']));
    });

    test('token-lite setting ignores prebuilt debug prompt payloads', async () => {
        loadGameState.mockReturnValue({ settings: { tokenPlaceTokenLite: false } });

        await TokenPlaceChatV2(
            [
                { role: 'user', content: 'older promptPayload bypass history canary' },
                { role: 'assistant', content: 'assistant promptPayload bypass history canary' },
                { role: 'user', content: 'latest token-lite user text' },
            ],
            {
                tokenPlaceTokenLite: true,
                promptPayload: {
                    combinedMessages: [
                        {
                            role: 'system',
                            content:
                                'full debug payload system canary with DSPACE knowledge text and PlayerState',
                        },
                        {
                            role: 'user',
                            content:
                                'full debug payload user canary with RAG/docs text and full history',
                        },
                    ],
                    contextSources: [{ title: 'debug RAG/docs source canary', url: '/docs/about' }],
                    gameState: { inventory: [{ id: 'debug-payload-inventory-canary' }] },
                },
            }
        );

        expect(searchDocsRag).not.toHaveBeenCalled();
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        const serializedDecrypted = JSON.stringify(decrypted);

        expect(decrypted.api_v1_request.options).toEqual({});
        expect(decrypted.api_v1_request.messages).toEqual([
            {
                role: 'system',
                content:
                    "You are dChat, a concise DSPACE assistant. Answer the user's message. If game-specific context is missing, say you do not know.",
            },
            { role: 'user', content: 'latest token-lite user text' },
        ]);
        expect(serializedDecrypted).not.toContain('full debug payload system canary');
        expect(serializedDecrypted).not.toContain('full debug payload user canary');
        expect(serializedDecrypted).not.toContain('debug-payload-inventory-canary');
        expect(serializedDecrypted).not.toContain('older promptPayload bypass history canary');
        expect(serializedDecrypted).not.toContain('assistant promptPayload bypass history canary');
        expect(serializedDecrypted).not.toContain('PlayerState');
        expect(serializedDecrypted).not.toContain('RAG/docs text');
        expect(serializedDecrypted).not.toContain('DSPACE knowledge text');
        expect(JSON.stringify(body)).not.toContain('latest token-lite user text');
        expect(body).toEqual(
            expect.objectContaining({
                cipherkey: expect.any(String),
                ciphertext: expect.any(String),
                iv: expect.any(String),
            })
        );
        expect(Object.keys(body)).not.toEqual(expect.arrayContaining(['messages', 'model']));
    });

    test('saved token-lite setting ignores prebuilt debug prompt payloads', async () => {
        loadGameState.mockReturnValue({ settings: { tokenPlaceTokenLite: true } });

        await TokenPlaceChatV2([{ role: 'user', content: 'latest saved-setting user text' }], {
            promptPayload: {
                combinedMessages: [
                    { role: 'system', content: 'full debug payload system canary' },
                    { role: 'user', content: 'full debug payload user canary' },
                ],
                contextSources: [{ title: 'debug source', url: '/docs/about' }],
                gameState: { inventory: [{ id: 'debug-payload-inventory-canary' }] },
            },
        });

        expect(searchDocsRag).not.toHaveBeenCalled();
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        const serializedMessages = JSON.stringify(decrypted.api_v1_request.messages);

        expect(decrypted.api_v1_request.messages).toEqual([
            expect.objectContaining({ role: 'system' }),
            { role: 'user', content: 'latest saved-setting user text' },
        ]);
        expect(serializedMessages).not.toContain('full debug payload system canary');
        expect(serializedMessages).not.toContain('full debug payload user canary');
        expect(JSON.stringify(decrypted)).not.toContain('debug-payload-inventory-canary');
    });

    test('token-lite blank or non-user inputs fall back before encryption', async () => {
        loadGameState.mockReturnValue({ settings: { tokenPlaceTokenLite: true } });

        await TokenPlaceChatV2([
            { role: 'assistant', content: 'assistant-only history' },
            { role: 'user', content: '   ' },
        ]);

        expect(searchDocsRag).not.toHaveBeenCalled();
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        expect(decrypted.api_v1_request.messages).toEqual([
            expect.objectContaining({ role: 'system' }),
            { role: 'user', content: 'Hello.' },
        ]);
        expect(JSON.stringify(body)).not.toContain('assistant-only history');
        expect(JSON.stringify(body)).not.toContain('Hello.');
    });

    test('normal small hi flow sends valid API v1 messages with empty options', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hi' }]);
        const decrypted = await decryptFirstRelayRequest();

        expect(decrypted.api_v1_request.options).toEqual({});
        expect(decrypted.api_v1_request.messages).toEqual(
            expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'hi' })])
        );
        expectValidApiV1Messages(decrypted.api_v1_request.messages);
    });

    test('large DSPACE knowledge prompt is shaped to token.place API v1 message limits', async () => {
        const userPrompt = 'USER_PROMPT_SECRET_SENTINEL';
        const ragExcerpt = 'DSPACE knowledge base DOCS_RAG_SECRET_SENTINEL ';
        const playerState = 'PlayerState PLAYER_STATE_SECRET_SENTINEL';
        await TokenPlaceChatV2([{ role: 'user', content: userPrompt }], {
            promptPayload: {
                combinedMessages: [
                    {
                        role: 'system',
                        content: `${playerState}
${ragExcerpt.repeat(4000)}`,
                    },
                    { role: 'assistant', content: 'older assistant context' },
                    { role: 'user', content: userPrompt },
                ],
                contextSources: [{ title: 'local only', url: '/docs/about' }],
                gameState: {},
            },
        });

        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        const messages = decrypted.api_v1_request.messages;

        expect(decrypted.api_v1_request.options).toEqual({});
        expect(messages.some((message) => message.content.includes(userPrompt))).toBe(true);
        expect(messages.filter((message) => message.role === 'system').length).toBeGreaterThan(1);
        expectValidApiV1Messages(messages);

        const serializedOuterBody = JSON.stringify(body);
        expect(serializedOuterBody).not.toContain('messages');
        expect(serializedOuterBody).not.toContain('model');
        expect(serializedOuterBody).not.toContain(userPrompt);
        expect(serializedOuterBody).not.toContain('DSPACE knowledge base');
        expect(serializedOuterBody).not.toContain('PlayerState');
        expect(serializedOuterBody).not.toContain('DOCS_RAG_SECRET_SENTINEL');
    });

    test('blank and invalid messages are normalized or removed before encryption', async () => {
        await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [
                    { role: 'developer', content: ' normalized developer prompt ', extra: true },
                    { role: 'user', content: '   ' },
                    { role: 'assistant', content: null },
                    { role: 'assistant', content: [{ type: 'text', text: 'array text content' }] },
                    { role: 'system', content: { kind: 'json-content', ok: true } },
                ],
                contextSources: [],
                gameState: {},
            },
        });
        const decrypted = await decryptFirstRelayRequest();
        const messages = decrypted.api_v1_request.messages;

        expect(messages).toEqual([
            { role: 'user', content: 'normalized developer prompt' },
            { role: 'assistant', content: 'array text content' },
            { role: 'system', content: '{"kind":"json-content","ok":true}' },
        ]);
        expectValidApiV1Messages(messages);
    });

    test('all-empty or invalid messages fall back to a valid API v1 user message', async () => {
        await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [
                    { role: 'developer', content: '   ', ignored: 'metadata' },
                    { role: 'assistant', content: null },
                    { role: 'system', content: undefined },
                    { role: 'tool', content: [] },
                    { role: 'function', content: [{ type: 'text', text: '' }, { content: '' }] },
                ],
                contextSources: [],
                gameState: {},
            },
        });
        const { body } = getFetchCallByPath('/api/v1/relay/requests');
        const decrypted = await decryptTokenPlaceEnvelope(body, relayServerKeys[0].privateKey);
        const messages = decrypted.api_v1_request.messages;

        expect(messages.length).toBeGreaterThan(0);
        expect(
            messages.every((message) => Object.keys(message).sort().join(',') === 'content,role')
        ).toBe(true);
        expect(
            messages.every((message) => ['system', 'user', 'assistant'].includes(message.role))
        ).toBe(true);
        expect(messages.every((message) => message.content.trim())).toBe(true);
        expect(decrypted.api_v1_request.options).toEqual({});
        expectValidApiV1Messages(messages);

        const serializedOuterBody = JSON.stringify(body);
        expect(serializedOuterBody).not.toContain('messages');
        expect(serializedOuterBody).not.toContain('model');
        expect(serializedOuterBody).not.toContain('Please continue.');
        expect(serializedOuterBody).not.toContain('metadata');
    });

    test('preserves primary system prompt when latest user input exceeds total budget', async () => {
        const systemPrompt = 'DSPACE persona and safety guardrails must remain present.';
        const hugeUserPrompt = 'OVERSIZED_USER_INPUT '.repeat(7000);
        await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'assistant', content: 'older assistant context' },
                    { role: 'user', content: hugeUserPrompt },
                ],
                contextSources: [],
                gameState: {},
            },
        });

        const decrypted = await decryptFirstRelayRequest();
        const messages = decrypted.api_v1_request.messages;

        expect(messages).toContainEqual({ role: 'system', content: systemPrompt });
        expect(messages.some((message) => message.role === 'user')).toBe(true);
        expectValidApiV1Messages(messages);
    });

    test('latest non-blank normalized user message is preserved under budget pressure', async () => {
        const developerPrompt = 'LATEST_NORMALIZED_DEVELOPER_PROMPT';
        await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [
                    { role: 'system', content: 'SYSTEM_CONTEXT '.repeat(9000) },
                    { role: 'user', content: 'older user prompt' },
                    { role: 'developer', content: developerPrompt },
                    { role: 'user', content: '   ' },
                ],
                contextSources: [],
                gameState: {},
            },
        });

        const decrypted = await decryptFirstRelayRequest();
        const messages = decrypted.api_v1_request.messages;

        expect(messages).toEqual(
            expect.arrayContaining([{ role: 'user', content: developerPrompt }])
        );
        expectValidApiV1Messages(messages);
    });

    test('non-JSON content normalizes to strings before trimming', async () => {
        await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [
                    { role: 'user', content: Symbol('token-place-symbol') },
                    { role: 'assistant', content: () => 'function content' },
                ],
                contextSources: [],
                gameState: {},
            },
        });

        const decrypted = await decryptFirstRelayRequest();
        const messages = decrypted.api_v1_request.messages;

        expect(messages).toEqual([
            { role: 'user', content: 'Symbol(token-place-symbol)' },
            { role: 'assistant', content: expect.stringContaining('function content') },
        ]);
        expectValidApiV1Messages(messages);
    });

    test('decryption accepts chat_history as the response ciphertext', async () => {
        const encrypted = await encryptTokenPlaceEnvelope(
            { ok: true, source: 'chat_history' },
            relayServerKeys[0].publicKeyPem
        );
        const decrypted = await decryptTokenPlaceEnvelope(
            {
                chat_history: encrypted.ciphertext,
                cipherkey: encrypted.cipherkey,
                iv: encrypted.iv,
            },
            relayServerKeys[0].privateKey
        );

        expect(decrypted).toEqual({ ok: true, source: 'chat_history' });
    });

    test('decryption accepts token.place static-chat compatible CBC relay response shape', async () => {
        const encrypted = await encryptTokenPlaceEnvelope(
            { ok: true, source: 'static-chat-compatible' },
            relayServerKeys[0].publicKeyPem
        );
        const fixture = {
            chat_history: encrypted.ciphertext,
            ciphertext: encrypted.ciphertext,
            cipherkey: encrypted.cipherkey,
            iv: encrypted.iv,
        };

        expect(Uint8Array.from(atob(fixture.iv), (char) => char.charCodeAt(0))).toHaveLength(16);
        expect(fixture).not.toHaveProperty('mode');
        expect(fixture).not.toHaveProperty('tag');
        await expect(
            decryptTokenPlaceEnvelope(fixture, relayServerKeys[0].privateKey)
        ).resolves.toEqual({
            ok: true,
            source: 'static-chat-compatible',
        });
    });

    test('decryption accepts ciphertext when chat_history is absent', async () => {
        const encrypted = await encryptTokenPlaceEnvelope(
            { ok: true, source: 'ciphertext' },
            relayServerKeys[0].publicKeyPem
        );
        const decrypted = await decryptTokenPlaceEnvelope(encrypted, relayServerKeys[0].privateKey);

        expect(decrypted).toEqual({ ok: true, source: 'ciphertext' });
    });

    test('decryption rejects responses missing chat_history and ciphertext fields', async () => {
        const encrypted = await encryptTokenPlaceEnvelope(
            { ok: true, source: 'missing-ciphertext-field' },
            relayServerKeys[0].publicKeyPem
        );
        const payload = {
            cipherkey: encrypted.cipherkey,
            iv: encrypted.iv,
        };

        await expect(
            decryptTokenPlaceEnvelope(payload, relayServerKeys[0].privateKey)
        ).rejects.toThrow('Malformed encrypted token.place response: missing ciphertext field.');
    });

    test('decryption rejects JSEncrypt-wrapped AES keys with invalid decoded length', async () => {
        const rsa = new JSEncrypt();
        rsa.setPublicKey(relayServerKeys[0].publicKeyPem);
        const cipherkey = rsa.encrypt(bytesToBase64(new Uint8Array(8)));

        await expect(
            decryptTokenPlaceEnvelope(
                {
                    ciphertext: bytesToBase64(new Uint8Array(16)),
                    cipherkey,
                    iv: bytesToBase64(new Uint8Array(16)),
                },
                relayServerKeys[0].privateKey
            )
        ).rejects.toThrow('Malformed encrypted token.place response.');
    });

    test('decryption accepts explicit GCM payloads with PEM private keys', async () => {
        const crypto = globalThis.crypto;
        const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, [
            'encrypt',
        ]);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            new TextEncoder().encode(JSON.stringify({ ok: true, mode: 'pem-gcm' }))
        );
        const cipherkey = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            relayServerKeys[0].publicKeyCrypto,
            rawAesKey
        );

        const decrypted = await decryptTokenPlaceEnvelope(
            {
                mode: 'AES-GCM',
                ciphertext: bytesToBase64(ciphertext),
                cipherkey: bytesToBase64(cipherkey),
                iv: bytesToBase64(iv),
            },
            relayServerKeys[0].privateKey
        );

        expect(decrypted).toEqual({ ok: true, mode: 'pem-gcm' });
    });

    test('decryption accepts explicit GCM payloads with embedded WebCrypto tags', async () => {
        const crypto = globalThis.crypto;
        const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, [
            'encrypt',
        ]);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            new TextEncoder().encode(JSON.stringify({ ok: true, mode: 'embedded-gcm-tag' }))
        );
        const cipherkey = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            relayServerKeys[0].publicKeyCrypto,
            rawAesKey
        );

        const decrypted = await decryptTokenPlaceEnvelope(
            {
                mode: 'AES-GCM',
                ciphertext: bytesToBase64(ciphertext),
                cipherkey: bytesToBase64(cipherkey),
                iv: bytesToBase64(iv),
            },
            relayServerKeys[0].privateKeyCrypto
        );

        expect(decrypted).toEqual({ ok: true, mode: 'embedded-gcm-tag' });
    });

    test('decryption accepts explicit GCM payloads with separate tags', async () => {
        const crypto = globalThis.crypto;
        const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, [
            'encrypt',
        ]);
        const encrypted = new Uint8Array(
            await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                new TextEncoder().encode(JSON.stringify({ ok: true, mode: 'separate-gcm-tag' }))
            )
        );
        const ciphertext = encrypted.slice(0, -16);
        const tag = encrypted.slice(-16);
        const cipherkey = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            relayServerKeys[0].publicKeyCrypto,
            rawAesKey
        );

        const decrypted = await decryptTokenPlaceEnvelope(
            {
                mode: 'aes-256-gcm',
                ciphertext: bytesToBase64(ciphertext),
                tag: bytesToBase64(tag),
                cipherkey: bytesToBase64(cipherkey),
                iv: bytesToBase64(iv),
            },
            relayServerKeys[0].privateKeyCrypto
        );

        expect(decrypted).toEqual({ ok: true, mode: 'separate-gcm-tag' });
    });

    test('decryption accepts CBC payloads with raw wrapped AES keys', async () => {
        const crypto = globalThis.crypto;
        const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-CBC' }, false, [
            'encrypt',
        ]);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            aesKey,
            new TextEncoder().encode(JSON.stringify({ ok: true, key: 'raw' }))
        );
        const cipherkey = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            relayServerKeys[0].publicKeyCrypto,
            rawAesKey
        );

        const decrypted = await decryptTokenPlaceEnvelope(
            {
                ciphertext: bytesToBase64(ciphertext),
                cipherkey: bytesToBase64(cipherkey),
                iv: bytesToBase64(iv),
            },
            relayServerKeys[0].privateKeyCrypto
        );

        expect(decrypted).toEqual({ ok: true, key: 'raw' });
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

    test('parses API v1 response.message assistant text and compatibility helper returns string', async () => {
        expect(extractTokenPlaceAssistantText({ message: { content: 'api v1 reply' } })).toBe(
            'api v1 reply'
        );
        relayReply = { message: { role: 'assistant', content: 'api v1 relay reply' } };
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'api v1 relay reply'
        );
    });

    test('parses OpenAI-compatible choices assistant text', async () => {
        expect(extractTokenPlaceAssistantText({ choices: [{ message: { content: 'hi' } }] })).toBe(
            'hi'
        );
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'mocked reply'
        );
    });

    test('prefers API v1 response.message over choices when both response shapes are present', () => {
        expect(
            extractTokenPlaceAssistantText({
                message: { role: 'assistant', content: 'api v1 reply' },
                choices: [{ message: { content: 'choices reply' } }],
            })
        ).toBe('api v1 reply');
    });

    test('rejects empty, missing, stub, and legacy raw-array assistant responses as malformed', () => {
        const malformedResponses = [
            { message: { content: '' } },
            { message: { content: '   ' } },
            { message: { content: 'stub' } },
            { message: {} },
            { choices: [{ message: { content: '' } }] },
            { choices: [{ message: { content: '   ' } }] },
            { choices: [{ message: { content: 'stub' } }] },
            { usage: { prompt_tokens: 1 } },
            [{ role: 'assistant', content: 'legacy history reply' }],
        ];

        for (const response of malformedResponses) {
            expect(() => extractTokenPlaceAssistantText(response)).toThrow(
                'Malformed token.place response: missing assistant content.'
            );
        }
    });

    test('structured API errors are not treated as missing assistant content', async () => {
        relayReply = {
            error: {
                message: 'blocked',
                type: 'content_policy_violation',
                code: 'content_blocked',
            },
        };

        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'content_policy',
            status: 400,
        });
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
        expect(result).toMatchObject({
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
            urlPathEndsWith(url, '/api/v1/relay/responses/retrieve')
        );
        expect(retrieveCalls).toHaveLength(3);
    });

    test('terminal selected-server failure clears selected server and can reselect', async () => {
        global.fetch = makeRelayFetch({ retrieveStatuses: [410, 200], serverFailureOnce: true });
        await expect(
            tokenPlaceChat([{ role: 'user', content: 'hello' }], { pollIntervalMs: 1 })
        ).resolves.toBe('mocked reply');
        const serverSelections = fetch.mock.calls.filter(([url]) =>
            urlPathEndsWith(url, '/api/v1/relay/servers/next')
        );
        const dispatches = fetch.mock.calls.filter(([url]) =>
            urlPathEndsWith(url, '/api/v1/relay/requests')
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
            fetch.mock.calls.some(([url]) => urlPathEndsWith(url, '/api/v1/relay/requests/cancel'))
        ).toBe(true);
    });

    test('relay accepted false fast-fails before polling', async () => {
        global.fetch = makeRelayFetch({ accepted: false });

        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'malformed',
            message: 'token.place relay rejected the request.',
        });
        expect(
            fetch.mock.calls.some(([url]) =>
                urlPathEndsWith(url, '/api/v1/relay/responses/retrieve')
            )
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
            if (urlPathEndsWith(url, '/api/v1/relay/servers/next')) {
                return { ok: true, status: 200, json: () => Promise.resolve({}) };
            }
            throw new Error(`Unexpected URL ${url}`);
        });
        await expect(tokenPlaceChat([])).rejects.toMatchObject({ type: 'malformed' });

        global.fetch = jest.fn(async (url) => {
            if (urlPathEndsWith(url, '/api/v1/relay/servers/next')) {
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
            if (urlPathEndsWith(url, '/api/v1/relay/servers/next')) {
                return {
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            server_public_key: relayServerKeys[0].publicKeyBase64,
                            context_tier: '8k-fast',
                        }),
                };
            }
            if (urlPathEndsWith(url, '/api/v1/relay/requests')) {
                return { ok: true, status: 200, json: () => Promise.resolve({ accepted: true }) };
            }
            if (urlPathEndsWith(url, '/api/v1/relay/responses/retrieve')) {
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

    test('requests estimated context tier, encrypts routing metadata, and records spillover diagnostics', async () => {
        global.fetch = makeRelayFetch();
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);

        const selectionUrl = new URL(getFetchCallByPath('/api/v1/relay/servers/next').url);
        expect(selectionUrl.searchParams.get('model')).toBe('llama-3.1-8b-instruct');
        expect(selectionUrl.searchParams.get('context_tier')).toBe('8k-fast');

        const encryptedRequest = await decryptFirstRelayRequest();
        expect(encryptedRequest.api_v1_request.routing).toMatchObject({
            context_tier: '8k-fast',
            selected_profile_id: 'test-8k',
        });
        expect(JSON.stringify(getFetchCallByPath('/api/v1/relay/requests').body)).not.toContain(
            'hello'
        );
    });

    test('missing selected tier metadata fails before dispatch', async () => {
        global.fetch = makeRelayFetch({ omitSelectedTier: true });

        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello missing relay tier' }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();
    });

    test('accepts larger selected context tier as spillover and rejects incompatible tiers', async () => {
        global.fetch = makeRelayFetch({ selectedTier: '64k-full' });
        await expect(TokenPlaceChatV2([{ role: 'user', content: 'hello' }])).resolves.toMatchObject(
            {
                metadata: { tokenPlaceContext: { spillover: true, relaySelectedTier: '64k-full' } },
            }
        );

        global.fetch = makeRelayFetch({ selectedTier: '8k-fast' });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'x'.repeat(25_000) }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();

        global.fetch = makeRelayFetch({ selectedTier: 'bogus-tier' });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello invalid relay tier' }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();
    });

    test('rejects incoherent selected context window and model support metadata before dispatch', async () => {
        global.fetch = makeRelayFetch({
            selectedTier: '64k-full',
            selectedWindowTokens: 8_000,
        });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello small relay window' }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();

        global.fetch = makeRelayFetch({
            selectedTier: '8k-fast',
            selectedModelSupport: ['other-model'],
        });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello unsupported relay model' }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();
    });

    test('validates selected context window metadata against exact tier budgets', async () => {
        global.fetch = makeRelayFetch({
            selectedTier: '8k-fast',
            selectedWindowTokens: 8_191,
        });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello just under 8k window' }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();

        global.fetch = makeRelayFetch({
            selectedTier: '8k-fast',
            selectedWindowTokens: 8_192,
        });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello exact 8k window' }])
        ).resolves.toMatchObject({ text: 'mocked reply' });

        global.fetch = makeRelayFetch({
            selectedTier: '64k-full',
            selectedWindowTokens: 65_535,
        });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'x'.repeat(25_000) }])
        ).rejects.toMatchObject({ type: 'malformed' });
        expect(getFetchCallByPath('/api/v1/relay/requests')).toBeUndefined();

        global.fetch = makeRelayFetch({
            selectedTier: '64k-full',
            selectedWindowTokens: 65_536,
        });
        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'x'.repeat(25_000) }])
        ).resolves.toMatchObject({ text: 'mocked reply' });
    });

    test('retries one exact 8K overflow on 64K with unchanged message payload', async () => {
        let retrieveCount = 0;
        global.fetch = makeRelayFetch({
            selectedTier: ({ selectionCount }) => (selectionCount === 1 ? '8k-fast' : '64k-full'),
            replyForRetrieve: ({ requestBody }) => {
                retrieveCount += 1;
                if (retrieveCount === 1) {
                    return {
                        error: {
                            code: 'compute_node_context_window_exceeded',
                            message: 'too large for active context',
                            retryable: true,
                            recommended_context_tier: '64k-full',
                        },
                    };
                }
                return { choices: [{ message: { content: 'retried reply' } }] };
            },
        });

        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello retry' }])
        ).resolves.toMatchObject({
            text: 'retried reply',
            metadata: { tokenPlaceContext: { escalationRetry: true } },
        });

        const selections = fetch.mock.calls
            .filter(([url]) => urlPathEndsWith(url, '/api/v1/relay/servers/next'))
            .map(([url]) => new URL(url).searchParams.get('context_tier'));
        expect(selections).toEqual(['8k-fast', '64k-full']);
        const requestBodies = fetch.mock.calls
            .filter(([url]) => urlPathEndsWith(url, '/api/v1/relay/requests'))
            .map(([, init]) => JSON.parse(init.body));
        expect(requestBodies[0].request_id).not.toBe(requestBodies[1].request_id);
        const first = await decryptTokenPlaceEnvelope(
            requestBodies[0],
            relayServerKeys[0].privateKey
        );
        const second = await decryptTokenPlaceEnvelope(
            requestBodies[1],
            relayServerKeys[0].privateKey
        );
        expect(first.api_v1_request.messages).toEqual(second.api_v1_request.messages);
    });

    test('reselects once when the 64K overflow retry selected server disconnects', async () => {
        let retrieveCount = 0;
        global.fetch = makeRelayFetch({
            selectedTier: ({ selectionCount }) => (selectionCount === 1 ? '8k-fast' : '64k-full'),
            retrieveStatuses: [200, 404, 200],
            replyForRetrieve: () => {
                retrieveCount += 1;
                if (retrieveCount === 1) {
                    return {
                        error: {
                            code: 'compute_node_context_window_exceeded',
                            message: 'too large for active context',
                            retryable: true,
                            recommended_context_tier: '64k-full',
                        },
                    };
                }
                return { choices: [{ message: { content: 'retried after disconnect' } }] };
            },
        });

        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello retry disconnect' }], {
                pollIntervalMs: 1,
            })
        ).resolves.toMatchObject({
            text: 'retried after disconnect',
            metadata: {
                tokenPlaceContext: {
                    requestedTier: '64k-full',
                    escalationRetry: true,
                },
            },
        });

        const selections = fetch.mock.calls
            .filter(([url]) => urlPathEndsWith(url, '/api/v1/relay/servers/next'))
            .map(([url]) => new URL(url).searchParams.get('context_tier'));
        expect(selections).toEqual(['8k-fast', '64k-full', '64k-full']);
    });

    test('does not retry 8K overflow when encrypted error reports active 64K tier', async () => {
        global.fetch = makeRelayFetch({
            selectedTier: '8k-fast',
            replyForRetrieve: () => ({
                error: {
                    code: 'compute_node_context_window_exceeded',
                    message: 'too large for active context',
                    retryable: true,
                    recommended_context_tier: '64k-full',
                    active_context_tier: '64k-full',
                },
            }),
        });

        await expect(
            TokenPlaceChatV2([{ role: 'user', content: 'hello no retry active 64k' }])
        ).rejects.toMatchObject({ status: 400 });

        const selections = fetch.mock.calls.filter(([url]) =>
            urlPathEndsWith(url, '/api/v1/relay/servers/next')
        );
        const dispatches = fetch.mock.calls.filter(([url]) =>
            urlPathEndsWith(url, '/api/v1/relay/requests')
        );
        expect(selections).toHaveLength(1);
        expect(dispatches).toHaveLength(1);
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
