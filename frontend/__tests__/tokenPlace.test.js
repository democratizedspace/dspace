import { webcrypto } from 'node:crypto';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
const jest = vi;
if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(),
    ready: Promise.resolve(),
}));

jest.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: jest.fn(async () => ({ excerptsText: '', sources: [] })),
}));

const { loadGameState } = await import('../src/utils/gameState/common.js');
const tokenPlaceModule = await import('../src/utils/tokenPlace.js');
const {
    TokenPlaceChatV2,
    buildTokenPlaceChatCompletionsUrl,
    buildTokenPlaceMetadata,
    encryptTokenPlaceEnvelope,
    extractTokenPlaceAssistantText,
    generateTokenPlaceClientKeypair,
    validateTokenPlaceResponseEnvelope,
    getTokenPlaceChatModel,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
} = tokenPlaceModule;
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');
const { buildChatPrompt } = await import('../src/utils/openAI.js');

const jsonResponse = (body = {}, status = 200, statusText = 'OK') => ({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
});

let relayServerKeyPair;

const mockRelayFetch = async ({ retrieveStatuses = [200], response = {} } = {}) => {
    relayServerKeyPair = await generateTokenPlaceClientKeypair();
    const statuses = [...retrieveStatuses];
    global.fetch = jest.fn(async (url, init = {}) => {
        if (url.endsWith('/api/v1/relay/servers/next')) {
            return jsonResponse({ server_public_key: relayServerKeyPair.publicKey });
        }
        if (url.endsWith('/api/v1/relay/requests')) return jsonResponse({ accepted: true });
        if (url.endsWith('/api/v1/relay/responses/retrieve')) {
            const status = statuses.shift() ?? 200;
            if (status === 202) return jsonResponse({ pending: true }, 202, 'Accepted');
            const retrieveBody = JSON.parse(init.body);
            const encrypted = await encryptTokenPlaceEnvelope(
                {
                    protocol: 'tokenplace_api_v1_relay_e2ee',
                    version: 1,
                    request_id: retrieveBody.request_id,
                    client_public_key: retrieveBody.client_public_key,
                    api_v1_response: {
                        choices: [{ message: { content: 'mocked reply' } }],
                        ...response,
                    },
                },
                retrieveBody.client_public_key
            );
            return jsonResponse(encrypted);
        }
        if (url.endsWith('/api/v1/relay/requests/cancel')) return jsonResponse({ canceled: true });
        throw new Error(`Unexpected fetch ${url}`);
    });
};

const getFetchCall = () => {
    const [url, init] = fetch.mock.calls[0];
    return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
};

describe('token.place API v1 client', () => {
    beforeEach(async () => {
        await mockRelayFetch();
        loadGameState.mockReturnValue({});
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('fresh/default state uses token.place relay', async () => {
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        const { url, init } = getFetchCall();
        expect(url).toBe('https://token.place/api/v1/relay/servers/next');
        expect(init.method).toBe('GET');
    });

    test('legacy enabled flags do not disable default token.place chat', async () => {
        process.env.VITE_TOKEN_PLACE_ENABLED = 'false';
        loadGameState.mockReturnValue({ tokenPlace: { enabled: false } });

        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);

        expect(fetch).toHaveBeenCalledTimes(3);
        const { url, init, body } = getFetchCall();
        expect(url).toBe('https://token.place/api/v1/relay/servers/next');
        expect(init.method).toBe('GET');
        expect(init.credentials).toBe('omit');
        expect(init.headers?.Authorization).toBeUndefined();
        expect(body).toBeUndefined();
    });

    test('VITE_TOKEN_PLACE_URL staging override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://staging.token.place/api/v1/relay/servers/next');
    });

    test('VITE_TOKEN_PLACE_URL production override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://token.place/api/v1/relay/servers/next');
    });

    test('explicit url overrides state and runtime compatibility values', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            url: 'https://explicit.token.place/api/v1',
            runtimeUrl: 'https://runtime.token.place',
        });
        expect(getFetchCall().url).toBe('https://explicit.token.place/api/v1/relay/servers/next');
    });

    test('state tokenPlace url compatibility override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://state.token.place/api/v1/relay/servers/next');
    });

    test('runtime url is used before saved state and VITE fallback', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://saved.token.place/' } });
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            runtimeUrl: 'https://staging.token.place/api',
        });
        expect(getFetchCall().url).toBe('https://staging.token.place/api/v1/relay/servers/next');
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
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(
            fetch.mock.calls.some(([url]) => String(url).endsWith('/api/v1/chat/completions'))
        ).toBe(false);
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
        const { init, body } = getFetchCall();
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
        expect(body).toBeUndefined();
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
        const relayBody = JSON.parse(
            fetch.mock.calls.find(([url]) => String(url).endsWith('/api/v1/relay/requests'))[1].body
        );
        expect(relayBody).toMatchObject({ protocol: 'tokenplace_api_v1_relay_e2ee', version: 1 });
        expect(relayBody).toHaveProperty('ciphertext');
        expect(relayBody).toHaveProperty('cipherkey');
        expect(relayBody).toHaveProperty('iv');
        expect(JSON.stringify(relayBody)).not.toContain('hello');
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
        await mockRelayFetch({
            response: {
                usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
                metadata: { client: 'dspace', conversation_id: 'conv-42' },
                contextSources: [{ title: 'provider field should not be used' }],
            },
        });
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
        await mockRelayFetch({ response: { choices: [{ message: { content: '' } }] } });
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

    test('shared prompt and token.place payload omit stale provider guidance', async () => {
        const promptPayload = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const serializedPrompt = JSON.stringify({
            combinedMessages: promptPayload.combinedMessages,
            debugMessages: promptPayload.debugMessages,
        });

        expect(serializedPrompt).not.toMatch(/token\.place is deferred/i);
        expect(serializedPrompt).not.toMatch(/chat uses OpenAI/i);

        await tokenPlaceChat([{ role: 'user', content: 'hello' }], { promptPayload });
        const serializedRequest = JSON.stringify(
            JSON.parse(
                fetch.mock.calls.find(([url]) => String(url).endsWith('/api/v1/relay/requests'))[1]
                    .body
            )
        );
        expect(serializedRequest).not.toMatch(/token\.place is deferred/i);
        expect(serializedRequest).not.toMatch(/chat uses OpenAI/i);
    });
    test('relay request is ciphertext-only and polling continues after HTTP 202', async () => {
        await mockRelayFetch({ retrieveStatuses: [202, 202, 200] });
        await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [
                    { role: 'system', content: 'DOCS_GROUNDING_SECRET_SENTINEL' },
                    { role: 'user', content: 'PLAYERSTATE_SECRET_SENTINEL inventory-save-secret' },
                ],
                contextSources: [],
                gameState: {},
            },
        });
        const relayCall = fetch.mock.calls.find(([url]) =>
            String(url).endsWith('/api/v1/relay/requests')
        );
        const body = JSON.parse(relayCall[1].body);
        expect(
            fetch.mock.calls.some(([url]) => String(url).endsWith('/api/v1/chat/completions'))
        ).toBe(false);
        expect(
            fetch.mock.calls.filter(([url]) => String(url).includes('/responses/retrieve'))
        ).toHaveLength(3);
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
        expect(serialized).not.toContain('DOCS_GROUNDING_SECRET_SENTINEL');
        expect(serialized).not.toContain('inventory-save-secret');
    });

    test('response envelope validation rejects mismatches and missing API response', () => {
        const expected = { request_id: 'request-1', client_public_key: 'client-key' };
        const valid = {
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: 1,
            request_id: 'request-1',
            client_public_key: 'client-key',
            api_v1_response: { choices: [{ message: { content: 'ok' } }] },
        };
        expect(validateTokenPlaceResponseEnvelope(valid, expected)).toBe(valid.api_v1_response);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...valid, request_id: 'other' }, expected)
        ).toThrow(/request mismatch/i);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...valid, client_public_key: 'other' }, expected)
        ).toThrow(/client key mismatch/i);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...valid, protocol: 'wrong' }, expected)
        ).toThrow(/wrong protocol/i);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...valid, version: 2 }, expected)
        ).toThrow(/wrong version/i);
        expect(() =>
            validateTokenPlaceResponseEnvelope({ ...valid, api_v1_response: undefined }, expected)
        ).toThrow(/missing API response/i);
    });
});
