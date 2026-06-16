import { vi } from 'vitest';
const jest = vi;

const mockedState = {
    quests: {},
    processes: {},
    inventory: {},
    openAI: { apiKey: 'sk-openai-secret' }, // scan-secrets: ignore
    tokenPlace: {},
};

jest.mock('openai', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(() => mockedState),
    ready: Promise.resolve(),
}));

jest.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: jest.fn(async () => ({
        excerptsText: 'Docs excerpt for DSPACE chat testing.',
        sources: [{ title: 'Docs', url: '/docs/about' }],
    })),
}));

const { loadGameState } = await import('../src/utils/gameState/common.js');
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
const { buildChatPrompt } = await import('../src/utils/openAI.js');

const successResponse = (data = {}) => ({
    ok: true,
    status: 200,
    json: () =>
        Promise.resolve({
            choices: [{ message: { content: 'mocked token.place reply' } }],
            usage: { total_tokens: 42 },
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
            ...data,
        }),
});

const latestFetchBody = () => JSON.parse(fetch.mock.calls.at(-1)[1].body);

const expectNoLegacyEndpoint = (url) => {
    expect(url).toContain('/api/v1/chat/completions');
    expect(url).not.toContain('/api/api/v1/chat/completions');
    expect(url).not.toMatch(/\/api\/chat$/);
    expect(url).not.toMatch(/(?<!completions)\/chat$/);
};

describe('token.place API v1 client', () => {
    beforeEach(() => {
        loadGameState.mockReturnValue(mockedState);
        global.fetch = jest.fn(() => Promise.resolve(successResponse()));
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('is enabled by default and legacy disabled state does not block v3.1 chat', async () => {
        loadGameState.mockReturnValue({ ...mockedState, tokenPlace: { enabled: false } });
        expect(isTokenPlaceEnabled()).toBe(true);
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('fresh/default state posts to the API v1 chat completions endpoint', async () => {
        loadGameState.mockReturnValue({ ...mockedState, tokenPlace: {} });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(fetch.mock.calls[0][0]).toBe('https://token.place/api/v1/chat/completions');
        expectNoLegacyEndpoint(fetch.mock.calls[0][0]);
    });

    test('VITE_TOKEN_PLACE_URL override works and strips trailing slashes', async () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place///';
        expect(resolveTokenPlaceBaseUrl({ state: { tokenPlace: {} } })).toBe(
            'https://staging.token.place'
        );
        expect(buildTokenPlaceChatCompletionsUrl({ state: { tokenPlace: {} } })).toBe(
            'https://staging.token.place/api/v1/chat/completions'
        );
    });

    test('state tokenPlace.url compatibility override wins when present', () => {
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        expect(
            buildTokenPlaceChatCompletionsUrl({
                state: { tokenPlace: { url: 'https://state.token.place' } },
            })
        ).toBe('https://state.token.place/api/v1/chat/completions');
    });

    test('legacy /api URL normalizes without producing duplicate api segments', () => {
        const url = buildTokenPlaceChatCompletionsUrl({
            state: { tokenPlace: { url: 'https://token.place/api' } },
        });
        expect(url).toBe('https://token.place/api/v1/chat/completions');
        expect(url).not.toContain('/api/api/v1/chat/completions');
    });

    test('default and env override models are used', () => {
        expect(getTokenPlaceChatModel()).toBe('gpt-5-chat-latest');
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'custom-chat-model';
        expect(getTokenPlaceChatModel()).toBe('custom-chat-model');
    });

    test('request shape is OpenAI-compatible, zero-auth, non-streaming, and safe', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            metadata: {
                conversation_id: 'conv-42',
                apiKey: 'tp-secret',
                inventory: { rocket: 1 },
                saveData: 'raw save',
            },
            stream: true,
        });
        const options = fetch.mock.calls[0][1];
        const body = latestFetchBody();
        const serializedBody = JSON.stringify(body);

        expect(options.method).toBe('POST');
        expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
        expect(options.headers.Authorization).toBeUndefined();
        expect(body.model).toBe('gpt-5-chat-latest');
        expect(Array.isArray(body.messages)).toBe(true);
        expect(body.messages.some((message) => message.role === 'user')).toBe(true);
        expect(body.stream).toBe(false);
        expect(body.metadata).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
        });
        expect(serializedBody).not.toContain('sk-openai-secret');
        expect(serializedBody).not.toContain('tp-secret');
        expect(serializedBody).not.toContain('raw save');
        expect(JSON.stringify(body.metadata)).not.toContain('rocket');
    });

    test('stream is absent when not requested', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        expect(latestFetchBody().stream).toBeUndefined();
    });

    test('safe metadata helper keeps only safe scalar values', () => {
        expect(
            buildTokenPlaceMetadata({
                conversation_id: 'conv-42',
                requestId: 7,
                token: 'secret',
                player_inventory: 'nope',
                nested: { unsafe: true },
            })
        ).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
            requestId: 7,
        });
    });

    test('response parser and rich helper return text, DSPACE contextSources, usage, and metadata', async () => {
        const result = await TokenPlaceChatV2([{ role: 'user', content: 'where are docs?' }]);
        expect(result.text).toBe('mocked token.place reply');
        expect(result.usage).toEqual({ total_tokens: 42 });
        expect(result.metadata).toEqual({ client: 'dspace', conversation_id: 'conv-42' });
        expect(result.contextSources.length).toBeGreaterThan(0);
        expect(result.contextSources[0]).toEqual(
            expect.objectContaining({ type: expect.any(String), url: expect.any(String) })
        );
        expect(result.contextSources).not.toEqual(result.metadata);
        expect(extractTokenPlaceAssistantText({ choices: [{ message: { content: 'hi' } }] })).toBe(
            'hi'
        );
    });

    test('compatibility tokenPlaceChat export returns only assistant text', async () => {
        await expect(tokenPlaceChat([{ role: 'user', content: 'hello' }])).resolves.toBe(
            'mocked token.place reply'
        );
    });

    test('abort signal is passed through', async () => {
        const controller = new AbortController();
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], { signal: controller.signal });
        expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
    });

    test('malformed responses classify as safe malformed provider responses', async () => {
        fetch.mockResolvedValueOnce(successResponse({ choices: [{ message: { content: '' } }] }));
        let caughtError;
        try {
            await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toMatchObject({ type: 'malformed' });
        expect(getTokenPlaceErrorSummary(caughtError)).toEqual({
            type: 'malformed',
            message: 'token.place returned a response DSPACE could not read. Please try again.',
        });
    });

    test.each([
        [
            'content policy',
            400,
            { message: 'blocked', type: 'content_policy_violation', code: 'content_blocked' },
            'content_policy',
        ],
        ['rate limit', 429, { message: 'too many requests', type: 'rate_limit' }, 'rate_limit'],
        ['server unavailable', 503, { message: 'unavailable', type: 'server_error' }, 'server'],
        [
            'generic provider',
            400,
            { message: 'invalid request', type: 'invalid_request_error' },
            'provider',
        ],
        [
            'stream true validation',
            400,
            { message: 'stream unsupported', param: 'stream' },
            'validation',
        ],
    ])('structured API error summary: %s', async (_name, status, error, expectedType) => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status,
            json: () => Promise.resolve({ error }),
        });

        try {
            await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
            throw new Error('expected rejection');
        } catch (caught) {
            expect(getTokenPlaceErrorSummary(caught).type).toBe(expectedType);
            expect(getTokenPlaceErrorSummary(caught).message).not.toMatch(/OpenAI/i);
        }
    });

    test('network and abort errors are classified safely', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        await expect(TokenPlaceChatV2([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'network',
        });

        fetch.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        await expect(TokenPlaceChatV2([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
            type: 'abort',
        });
    });

    test('token.place request and debug/system payloads do not include stale v3.0 guidance', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        const serializedRequest = JSON.stringify(latestFetchBody());
        const { debugMessages } = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const serializedDebug = JSON.stringify(debugMessages);

        expect(serializedRequest).not.toMatch(/token\.place is deferred/i);
        expect(serializedRequest).not.toMatch(/chat uses OpenAI/i);
        expect(serializedDebug).not.toMatch(/token\.place is deferred/i);
        expect(serializedDebug).not.toMatch(/chat uses OpenAI/i);
        expect(serializedRequest).toMatch(/token\.place is the default provider/i);
    });
});
