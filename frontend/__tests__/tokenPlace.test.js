import { describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/openAI.js', () => ({
    buildChatPrompt: vi.fn(),
    validateChatResponseText: vi.fn((text) => ({ text, wasSanitized: false })),
}));

import {
    DEFAULT_TOKEN_PLACE_CHAT_MODEL,
    TokenPlaceChatV2,
    buildTokenPlaceChatCompletionsUrl,
    buildTokenPlaceMetadata,
    extractTokenPlaceAssistantText,
    getTokenPlaceChatModel,
    isTokenPlaceEnabled,
    resolveTokenPlaceBaseUrl,
    tokenPlaceChat,
} from '../src/utils/tokenPlace.js';
import { getTokenPlaceErrorSummary } from '../src/utils/tokenPlaceErrors.js';
import { loadGameState } from '../src/utils/gameState/common.js';
import { buildChatPrompt } from '../src/utils/openAI.js';

const providerResponse = (overrides = {}) => ({
    id: 'chatcmpl-test',
    object: 'chat.completion',
    choices: [{ message: { role: 'assistant', content: 'mocked reply' } }],
    usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
    metadata: { client: 'dspace', conversation_id: 'conv-42' },
    ...overrides,
});

const fetchOk = (json = providerResponse()) =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(json),
    });

const promptPayload = {
    combinedMessages: [
        {
            role: 'system',
            content: 'DSPACE v3.1 provider-neutral system prompt with token.place default support.',
        },
        { role: 'user', content: 'hello' },
    ],
    contextSources: [{ title: 'Docs', url: '/docs/about' }],
};

describe('token.place API v1 URL and model helpers', () => {
    afterEach(() => {
        vi.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
    });

    test('defaults to token.place origin and chat completions endpoint', () => {
        loadGameState.mockReturnValue({});
        expect(resolveTokenPlaceBaseUrl()).toBe('https://token.place');
        expect(buildTokenPlaceChatCompletionsUrl(resolveTokenPlaceBaseUrl())).toBe(
            'https://token.place/api/v1/chat/completions'
        );
    });

    test('uses VITE_TOKEN_PLACE_URL override', () => {
        loadGameState.mockReturnValue({});
        process.env.VITE_TOKEN_PLACE_URL = 'https://staging.token.place/';
        expect(resolveTokenPlaceBaseUrl()).toBe('https://staging.token.place');
    });

    test('uses state.tokenPlace.url compatibility override when present', () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'https://local.token.place/' } });
        process.env.VITE_TOKEN_PLACE_URL = 'https://env.token.place';
        expect(resolveTokenPlaceBaseUrl()).toBe('https://local.token.place');
    });

    test('normalizes legacy /api base URLs without creating /api/api', () => {
        expect(buildTokenPlaceChatCompletionsUrl('https://token.place/api')).toBe(
            'https://token.place/api/v1/chat/completions'
        );
        expect(buildTokenPlaceChatCompletionsUrl('https://token.place/api')).not.toContain(
            '/api/api/v1/chat/completions'
        );
    });

    test('uses default and override chat model env var names', () => {
        expect(getTokenPlaceChatModel()).toBe(DEFAULT_TOKEN_PLACE_CHAT_MODEL);
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'gpt-test-alias';
        expect(getTokenPlaceChatModel()).toBe('gpt-test-alias');
    });

    test('is enabled by default for v3.1 compatibility', () => {
        expect(isTokenPlaceEnabled({ state: { tokenPlace: { enabled: false } } })).toBe(true);
    });
});

describe('token.place metadata and response helpers', () => {
    test('builds safe metadata and filters secrets/player save details', () => {
        expect(
            buildTokenPlaceMetadata({
                conversation_id: 'conv-42',
                apiKey: 'sk-nope',
                tokenPlaceToken: 'tp-nope',
                inventory: { rocket: 1 },
                playerSave: 'raw-save',
            })
        ).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
        });
    });

    test('extracts OpenAI-compatible assistant text and rejects malformed content', () => {
        expect(extractTokenPlaceAssistantText(providerResponse())).toBe('mocked reply');
        expect(() =>
            extractTokenPlaceAssistantText({ choices: [{ message: { content: '' } }] })
        ).toThrow('malformed response');
    });
});

describe('TokenPlaceChatV2', () => {
    beforeEach(() => {
        loadGameState.mockReturnValue({ openAI: { apiKey: 'sk-secret' }, tokenPlace: {} });
        buildChatPrompt.mockResolvedValue(promptPayload);
        global.fetch = vi.fn(() => fetchOk());
    });

    afterEach(() => {
        vi.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_CHAT_MODEL;
    });

    test('posts fresh state to token.place API v1 and not legacy chat endpoints', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }]);
        const [url, request] = fetch.mock.calls[0];
        expect(url).toBe('https://token.place/api/v1/chat/completions');
        expect(url).not.toMatch(/\/api\/chat$|\/chat$/);
        expect(request.method).toBe('POST');
    });

    test('sends OpenAI-compatible non-streaming body with no Authorization header or secrets', async () => {
        await TokenPlaceChatV2([{ role: 'user', content: 'hello' }], {
            metadata: { conversation_id: 'conv-42', credential: 'secret', openAIKey: 'sk-secret' },
        });
        const request = fetch.mock.calls[0][1];
        const body = JSON.parse(request.body);
        const serializedBody = JSON.stringify(body);
        expect(request.headers).toEqual({ 'Content-Type': 'application/json' });
        expect(request.headers.Authorization).toBeUndefined();
        expect(body.model).toBe('gpt-5-chat-latest');
        expect(body.messages).toEqual(promptPayload.combinedMessages);
        expect(body.stream).not.toBe(true);
        expect(body.metadata).toEqual({
            client: 'dspace',
            provider: 'token.place',
            conversation_id: 'conv-42',
        });
        expect(serializedBody).not.toContain('sk-secret');
        expect(serializedBody).not.toContain('credential');
    });

    test('uses VITE_TOKEN_PLACE_CHAT_MODEL in request body', async () => {
        process.env.VITE_TOKEN_PLACE_CHAT_MODEL = 'gpt-custom';
        await TokenPlaceChatV2([]);
        expect(JSON.parse(fetch.mock.calls[0][1].body).model).toBe('gpt-custom');
    });

    test('returns text, DSPACE contextSources, usage, and token.place metadata', async () => {
        const result = await TokenPlaceChatV2([]);
        expect(result).toEqual({
            text: 'mocked reply',
            contextSources: promptPayload.contextSources,
            usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
            metadata: { client: 'dspace', conversation_id: 'conv-42' },
        });
    });

    test('compatibility tokenPlaceChat returns assistant text only', async () => {
        await expect(tokenPlaceChat([])).resolves.toBe('mocked reply');
    });

    test('passes abort signal through to fetch', async () => {
        const controller = new AbortController();
        await TokenPlaceChatV2([], { signal: controller.signal });
        expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
    });

    test('token.place payloads do not include stale v3.0 provider guidance', async () => {
        await TokenPlaceChatV2([]);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        const payload = JSON.stringify(body.messages).toLowerCase();
        expect(payload).not.toContain('token.place is deferred');
        expect(payload).not.toContain('chat uses openai');
    });

    test('malformed 200 response throws and summarizes safely', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
        });
        await expect(TokenPlaceChatV2([])).rejects.toMatchObject({ type: 'malformed' });
    });
});

describe('token.place error summaries', () => {
    test('summarizes content policy, 429, 5xx, stream, generic provider, network, and malformed', () => {
        expect(
            getTokenPlaceErrorSummary({
                status: 400,
                providerError: { type: 'content_policy_violation', code: 'content_blocked' },
            }).type
        ).toBe('content_policy');
        expect(getTokenPlaceErrorSummary({ status: 429, providerError: {} }).type).toBe(
            'rate_limit'
        );
        expect(getTokenPlaceErrorSummary({ status: 503, providerError: {} }).type).toBe(
            'unavailable'
        );
        expect(
            getTokenPlaceErrorSummary({
                status: 400,
                providerError: { type: 'invalid_request_error', param: 'stream' },
            }).type
        ).toBe('stream_unsupported');
        expect(
            getTokenPlaceErrorSummary({ status: 400, providerError: { message: 'bad' } }).type
        ).toBe('provider');
        expect(getTokenPlaceErrorSummary(new TypeError('Failed to fetch')).type).toBe('network');
        expect(getTokenPlaceErrorSummary({ type: 'malformed' }).message).not.toContain('OpenAI');
    });
});
