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
    extractTokenPlaceAssistantText,
    getTokenPlaceChatModel,
    isTokenPlaceEnabled,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
} = await import('../src/utils/tokenPlace.js');
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');

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

    test('VITE_TOKEN_PLACE_URL override works', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(getFetchCall().url).toBe('https://staging.token.place/api/v1/chat/completions');
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
                apiKey: 'token-place-secret',
                playerSave: { raw: true },
                token: 'hidden',
            },
        });
        const { init, body } = getFetchCall();
        expect(init.headers.Authorization).toBeUndefined();
        expect(init.credentials).toBe('omit');
        const serialized = JSON.stringify({ headers: init.headers, body });
        expect(serialized).not.toContain('sk-secret-openai-key');
        expect(serialized).not.toContain('token-place-secret');
        expect(serialized).not.toContain('hidden');
        expect(body.metadata).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
        });
    });

    test('request body includes model, schema-safe messages, safe metadata, and no true stream', async () => {
        await TokenPlaceChatV2([
            {
                role: 'user',
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
        expect(getTokenPlaceErrorSummary(thrownError)).toEqual({
            type: 'malformed',
            message: 'token.place returned an unexpected response. Please try again shortly.',
        });
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

    test('stale provider guidance is absent from token.place request payloads', async () => {
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        const serialized = JSON.stringify(getFetchCall().body);
        expect(serialized).not.toMatch(/token\.place is deferred/i);
        expect(serialized).not.toMatch(/chat uses OpenAI/i);
    });
});

describe('isTokenPlaceEnabled', () => {
    test('keeps the legacy token.place panel disabled by default', () => {
        expect(isTokenPlaceEnabled({ state: {} })).toBe(false);
        expect(isTokenPlaceEnabled({ state: { tokenPlace: { enabled: false } } })).toBe(false);
    });

    test('supports explicit legacy opt-in while provider-aware UI is pending', () => {
        expect(isTokenPlaceEnabled({ state: { tokenPlace: { enabled: true } } })).toBe(true);
        process.env.VITE_TOKEN_PLACE_ENABLED = 'true';
        expect(isTokenPlaceEnabled({ state: {} })).toBe(true);
        process.env.VITE_TOKEN_PLACE_ENABLED = 'false';
        expect(isTokenPlaceEnabled({ state: { tokenPlace: { enabled: true } } })).toBe(false);
    });
});
