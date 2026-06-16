import { vi } from 'vitest';
const jest = vi;

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(),
    ready: Promise.resolve(),
}));

jest.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: jest.fn(() => Promise.resolve({ excerptsText: '', sources: [] })),
}));

jest.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledgePack: jest.fn(() => ({ summary: '', sources: [] })),
}));

const {
    TokenPlaceChatV2,
    buildTokenPlaceChatCompletionsUrl,
    buildTokenPlaceMetadata,
    extractTokenPlaceAssistantText,
    getTokenPlaceChatModel,
    isTokenPlaceEnabled,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
} = await import('../src/utils/tokenPlace.js');
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');
const { buildChatPrompt, providerRealityLine } = await import('../src/utils/openAI.js');
const { loadGameState } = await import('../src/utils/gameState/common.js');

const openAIKey = 'sk-openai-test-secret'; // scan-secrets: ignore
const tokenPlaceCredential = 'token-place-secret'; // scan-secrets: ignore

const mockChatCompletion = (overrides = {}) => ({
    id: 'chatcmpl-test',
    object: 'chat.completion',
    choices: [
        {
            index: 0,
            message: { role: 'assistant', content: 'mocked token.place reply' },
            finish_reason: 'stop',
        },
    ],
    usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 },
    metadata: { client: 'dspace', conversation_id: 'conv-42' },
    ...overrides,
});

const mockFetchOk = (body = mockChatCompletion()) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: () => Promise.resolve(body),
        })
    );
};

const getFetchRequest = () => {
    const [url, init] = fetch.mock.calls[0];
    return { url, init, body: JSON.parse(init.body) };
};

describe('token.place API v1 URL/model helpers', () => {
    afterEach(() => {
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_BASE_URL;
        delete process.env.VITE_TOKEN_PLACE_MODEL;
        jest.resetAllMocks();
    });

    test('defaults to the token.place API v1 chat-completions endpoint', () => {
        loadGameState.mockReturnValue({});
        expect(resolveTokenPlaceBaseUrl()).toBe('https://token.place');
        expect(buildTokenPlaceChatCompletionsUrl()).toBe(
            'https://token.place/api/v1/chat/completions'
        );
    });

    test('uses VITE_TOKEN_PLACE_URL override', () => {
        loadGameState.mockReturnValue({});
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        expect(buildTokenPlaceChatCompletionsUrl()).toBe(
            'https://staging.token.place/api/v1/chat/completions'
        );
    });

    test('uses state tokenPlace.url as compatibility override', () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://state.token.place/' } });
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        expect(buildTokenPlaceChatCompletionsUrl()).toBe(
            'https://state.token.place/api/v1/chat/completions'
        );
    });

    test('normalizes legacy /api values without producing duplicate /api paths', () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://token.place/api' } });
        const url = buildTokenPlaceChatCompletionsUrl();
        expect(url).toBe('https://token.place/api/v1/chat/completions');
        expect(url).not.toContain('/api/api/v1/chat/completions');
        expect(url).not.toMatch(/\/api\/chat$/);
        expect(url).not.toMatch(/[^i]\/chat$/);
    });

    test('defaults and overrides the chat model with the v3.1 env var only', () => {
        expect(getTokenPlaceChatModel()).toBe('gpt-5-chat-latest');
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'custom-token-place-model';
        process.env.VITE_TOKEN_PLACE_MODEL = 'wrong-model-name';
        expect(getTokenPlaceChatModel()).toBe('custom-token-place-model');
    });

    test('is enabled by default for v3.1 compatibility', () => {
        expect(isTokenPlaceEnabled({ state: { tokenPlace: { enabled: false } } })).toBe(true);
    });
});

describe('TokenPlaceChatV2', () => {
    beforeEach(() => {
        loadGameState.mockReturnValue({
            tokenPlace: { enabled: false },
            openAI: { apiKey: openAIKey },
        });
        mockFetchOk();
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
    });

    test('posts OpenAI-compatible non-streaming request to API v1 without auth', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            metadata: {
                conversation_id: 'conv-42',
                apiKey: tokenPlaceCredential,
                openAIKey,
                inventory: ['secret item'],
            },
        });

        const { url, init, body } = getFetchRequest();
        const serializedBody = init.body;
        expect(url).toBe('https://token.place/api/v1/chat/completions');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
        expect(init.headers.Authorization).toBeUndefined();
        expect(body.model).toBe('gpt-5-chat-latest');
        expect(Array.isArray(body.messages)).toBe(true);
        expect(body.messages.some((message) => message.role === 'user')).toBe(true);
        expect(body.stream).not.toBe(true);
        expect(body.metadata).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
        });
        expect(serializedBody).not.toContain(openAIKey);
        expect(serializedBody).not.toContain(tokenPlaceCredential);
    });

    test('passes abort signal through to fetch', async () => {
        const controller = new AbortController();
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], { signal: controller.signal });
        expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
    });

    test('parses assistant text and preserves context sources, usage, and metadata', async () => {
        const contextSources = [{ title: 'Docs', url: '/docs/about' }];
        const result = await TokenPlaceChatV2([], {
            promptPayload: {
                combinedMessages: [{ role: 'user', content: 'hello' }],
                gameState: {},
                contextSources,
            },
        });

        expect(result).toEqual({
            text: 'mocked token.place reply',
            contextSources,
            usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 },
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
        });
    });

    test('tokenPlaceChat remains a string-returning compatibility helper', async () => {
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'mocked token.place reply'
        );
    });

    test('throws and summarizes malformed 200 responses safely', async () => {
        mockFetchOk({ choices: [{ message: { content: '' } }] });
        await expect(TokenPlaceChatV2([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            tokenPlaceType: 'malformed_response',
        });
        try {
            await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        } catch (error) {
            expect(getTokenPlaceErrorSummary(error)).toEqual({
                type: 'malformed_response',
                message: 'token.place returned a response DSPACE could not read. Please try again.',
            });
        }
    });

    test('structured content policy errors produce safe summaries', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: () =>
                Promise.resolve({
                    error: {
                        message: 'blocked',
                        type: 'content_policy_violation',
                        code: 'content_blocked',
                    },
                }),
        });
        await expect(TokenPlaceChatV2([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'content_policy_violation',
            code: 'content_blocked',
        });
        try {
            await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        } catch (error) {
            expect(getTokenPlaceErrorSummary(error).type).toBe('content_policy');
            expect(getTokenPlaceErrorSummary(error).message).not.toMatch(/OpenAI/i);
        }
    });

    test('HTTP 429 and 5xx errors produce expected summaries', () => {
        expect(getTokenPlaceErrorSummary({ status: 429 })).toMatchObject({ type: 'rate_limit' });
        expect(getTokenPlaceErrorSummary({ status: 503 })).toMatchObject({ type: 'server' });
    });

    test('generic provider and stream validation errors produce safe summaries', () => {
        expect(
            getTokenPlaceErrorSummary({
                status: 400,
                type: 'invalid_request_error',
                param: 'stream',
            })
        ).toMatchObject({ type: 'provider_validation' });
        expect(
            getTokenPlaceErrorSummary({ status: 400, type: 'invalid_request_error' })
        ).toMatchObject({ type: 'provider' });
    });

    test('network and abort errors produce expected summaries', () => {
        expect(getTokenPlaceErrorSummary(new TypeError('Failed to fetch'))).toMatchObject({
            type: 'network',
        });
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        expect(getTokenPlaceErrorSummary(abortError)).toMatchObject({ type: 'abort' });
    });
});

describe('token.place metadata and response helpers', () => {
    test('buildTokenPlaceMetadata keeps only safe plain-object scalar metadata', () => {
        expect(
            buildTokenPlaceMetadata({
                conversation_id: 'conv-42',
                attempt: 2,
                debug: true,
                nested: { unsafe: true },
                api_key: 'secret',
                tokenPlaceCredential: 'secret',
                playerState: 'secret',
            })
        ).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
            attempt: 2,
            debug: true,
        });
    });

    test('extractTokenPlaceAssistantText reads choices[0].message.content', () => {
        expect(extractTokenPlaceAssistantText(mockChatCompletion())).toBe(
            'mocked token.place reply'
        );
        expect(() => extractTokenPlaceAssistantText({ choices: [] })).toThrow(
            'token.place returned a malformed chat response.'
        );
    });
});

describe('shared prompt guidance for token.place', () => {
    beforeEach(() => {
        loadGameState.mockReturnValue({});
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('provider reality line is v3.1 accurate', () => {
        expect(providerRealityLine).toMatch(/v3\.1/i);
        expect(providerRealityLine).not.toMatch(/deferred/i);
        expect(providerRealityLine).not.toMatch(/chat uses OpenAI/i);
    });

    test('token.place request payloads do not include stale v3.0 provider guidance', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        const { body } = getFetchRequest();
        const payload = JSON.stringify(body.messages);
        expect(payload).not.toMatch(/token\.place is deferred/i);
        expect(payload).not.toMatch(/chat uses OpenAI/i);
    });

    test('debug/system prompt construction does not include stale v3.0 provider guidance', async () => {
        const prompt = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const payload = JSON.stringify(prompt.debugMessages);
        expect(payload).not.toMatch(/token\.place is deferred/i);
        expect(payload).not.toMatch(/chat uses OpenAI/i);
    });
});
