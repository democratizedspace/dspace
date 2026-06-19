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

const getFetchCall = () => {
    const [url, init] = fetch.mock.calls[0];
    return { url, init, body: JSON.parse(init.body) };
};

describe('token.place API v1 client', () => {
    beforeEach(() => {
        global.fetch = jest.fn(() => Promise.resolve(okResponse()));
        loadGameState.mockReturnValue({});
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('fresh/default state posts to token.place API v1 chat completions', async () => {
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        const { url, init } = getFetchCall();
        expect(url).toBe('https://token.place/api/v1/chat/completions');
        expect(init.method).toBe('POST');
    });

    test('legacy enabled flags do not disable default token.place chat', async () => {
        process.env.VITE_TOKEN_PLACE_ENABLED = 'false';
        loadGameState.mockReturnValue({ tokenPlace: { enabled: false } });

        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);

        expect(fetch).toHaveBeenCalledTimes(1);
        const { url, init, body } = getFetchCall();
        expect(url).toBe('https://token.place/api/v1/chat/completions');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('omit');
        expect(init.headers?.Authorization).toBeUndefined();
        expect(body.messages).toContainEqual({ role: 'user', content: 'hello' });
    });

    test('runtime URL takes precedence over VITE_TOKEN_PLACE_URL and production default', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], {
            runtimeUrl: 'https://staging.token.place/api',
        });
        expect(getFetchCall().url).toBe('https://staging.token.place/api/v1/chat/completions');
    });

    test('explicit URL overrides compatibility state and runtime URL', async () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], {
            url: 'https://explicit.token.place',
            runtimeUrl: 'https://staging.token.place',
        });
        expect(getFetchCall().url).toBe('https://explicit.token.place/api/v1/chat/completions');
    });

    test('compatibility state URL overrides runtime URL intentionally', async () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], {
            runtimeUrl: 'https://staging.token.place',
        });
        expect(getFetchCall().url).toBe('https://state.token.place/api/v1/chat/completions');
    });

    test('runtime model overrides VITE model but not explicit model', async () => {
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'vite-model';
        expect(getTokenPlaceChatModel({ runtimeModel: 'runtime-model' })).toBe('runtime-model');
        expect(
            getTokenPlaceChatModel({ model: 'explicit-model', runtimeModel: 'runtime-model' })
        ).toBe('explicit-model');
        await tokenPlaceChat([{ role: 'user', content: 'hello' }], {
            runtimeModel: 'runtime-model',
        });
        expect(getFetchCall().body.model).toBe('runtime-model');
    });

    test('VITE_TOKEN_PLACE_URL staging override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://staging.token.place/api/v1/chat/completions');
    });

    test('VITE_TOKEN_PLACE_URL production override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://token.place/api/v1/chat/completions');
    });

    test('state tokenPlace url compatibility override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://state.token.place/api/v1/chat/completions');
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
        expect(getTokenPlaceChatModel()).toBe('gpt-5-chat-latest');
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'custom-model';
        expect(getTokenPlaceChatModel()).toBe('custom-model');
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().body.model).toBe('custom-model');
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
        expect(body.metadata).toEqual({
            conversation_id: 'conv-42',
            client: 'dspace',
            provider: 'token.place',
        });
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
        const { body } = getFetchCall();
        expect(body.model).toBe('gpt-5-chat-latest');
        expect(body.messages[0].role).toBe('system');
        expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'hello' });
        expect(body.messages.at(-1)).not.toHaveProperty('id');
        expect(body.messages.at(-1)).not.toHaveProperty('timestamp');
        expect(body.messages.at(-1)).not.toHaveProperty('tokens');
        expect(body.messages.at(-1)).not.toHaveProperty('avatar');
        expect(body.metadata).toEqual({ client: 'dspace', provider: 'token.place' });
        expect(body.stream).not.toBe(true);
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
        fetch.mockResolvedValueOnce(
            okResponse({
                usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
                metadata: { client: 'dspace', conversation_id: 'conv-42' },
                contextSources: [{ title: 'provider field should not be used' }],
            })
        );
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
        const serializedRequest = JSON.stringify(getFetchCall().body.messages);
        expect(serializedRequest).not.toMatch(/token\.place is deferred/i);
        expect(serializedRequest).not.toMatch(/chat uses OpenAI/i);
    });
});
