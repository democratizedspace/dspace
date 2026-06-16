import { loadGameState, ready } from './gameState/common.js';
import { buildChatPrompt, validateChatResponseText } from './openAI.js';
import { createTokenPlaceError } from './tokenPlaceErrors.js';

export const DEFAULT_TOKEN_PLACE_BASE_URL = 'https://token.place';
export const TOKEN_PLACE_CHAT_COMPLETIONS_PATH = '/api/v1/chat/completions';
export const DEFAULT_TOKEN_PLACE_CHAT_MODEL = 'gpt-5-chat-latest';

const readEnvValue = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env[key];
    }
    return undefined;
};

const isPlainObject = (value) =>
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const normalizeMetadataValue = (value) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? trimmed.slice(0, 200) : undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'boolean') return value;
    return undefined;
};

const metadataKeyLooksSecret = (key) =>
    /(?:api[_-]?key|openai|authorization|bearer|credential|inventory|password|player|save|secret|token)/i.test(
        key
    );

export const resolveTokenPlaceBaseUrl = (options = {}) => {
    const state = options.state || loadGameState();
    const configuredUrl = state?.tokenPlace?.url || readEnvValue('VITE_TOKEN_PLACE_URL');
    const rawUrl = String(configuredUrl || DEFAULT_TOKEN_PLACE_BASE_URL).trim();
    const withoutTrailingSlashes = rawUrl.replace(/\/+$/g, '');
    const withoutLegacyApiSuffix = withoutTrailingSlashes.replace(/\/api$/i, '');
    return withoutLegacyApiSuffix || DEFAULT_TOKEN_PLACE_BASE_URL;
};

export const buildTokenPlaceChatCompletionsUrl = (baseUrl) =>
    `${String(baseUrl || DEFAULT_TOKEN_PLACE_BASE_URL)
        .replace(/\/+$/g, '')
        .replace(/\/api$/i, '')}${TOKEN_PLACE_CHAT_COMPLETIONS_PATH}`;

export const getTokenPlaceChatModel = () =>
    readEnvValue('VITE_TOKEN_PLACE_CHAT_MODEL')?.trim() || DEFAULT_TOKEN_PLACE_CHAT_MODEL;

export const buildTokenPlaceMetadata = (metadata = {}) => {
    const safeMetadata = {
        client: 'dspace',
        provider: 'token.place',
    };

    if (!isPlainObject(metadata)) {
        return safeMetadata;
    }

    for (const [key, value] of Object.entries(metadata)) {
        if (!key || metadataKeyLooksSecret(key)) continue;
        const safeValue = normalizeMetadataValue(value);
        if (safeValue !== undefined) {
            safeMetadata[key] = safeValue;
        }
    }

    safeMetadata.client = 'dspace';
    safeMetadata.provider = 'token.place';
    return safeMetadata;
};

export const extractTokenPlaceAssistantText = (responseJson) => {
    const content = responseJson?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        throw createTokenPlaceError('malformed', 'token.place returned a malformed response.');
    }
    return content;
};

export const isTokenPlaceEnabled = () => true;

const readResponseJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const assertNonStreaming = (requestBody) => {
    if (requestBody.stream === true) {
        throw createTokenPlaceError('provider', 'token.place API v1 does not support streaming.', {
            status: 400,
            providerError: {
                message: 'token.place API v1 does not support streaming.',
                type: 'invalid_request_error',
                param: 'stream',
                code: 'unsupported_stream',
            },
        });
    }
};

export const TokenPlaceChatV2 = async (messages, options = {}) => {
    await ready;
    const state = options.state || loadGameState();
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const contextSources = Array.isArray(promptPayload.contextSources)
        ? promptPayload.contextSources
        : [];
    const requestBody = {
        model: getTokenPlaceChatModel(),
        messages: promptPayload.combinedMessages,
        metadata: buildTokenPlaceMetadata(options.metadata),
    };

    assertNonStreaming(requestBody);

    const url = buildTokenPlaceChatCompletionsUrl(resolveTokenPlaceBaseUrl({ state }));
    let response;

    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: options.signal,
        });
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw createTokenPlaceError('abort', 'The token.place request was canceled.', {
                cause: error,
            });
        }
        throw createTokenPlaceError('network', 'Unable to reach token.place.', { cause: error });
    }

    const responseJson = await readResponseJson(response);

    if (!response.ok) {
        const providerError = responseJson?.error;
        throw createTokenPlaceError('provider', providerError?.message || response.statusText, {
            status: response.status,
            providerError,
        });
    }

    const outputText = extractTokenPlaceAssistantText(responseJson);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return {
        text,
        contextSources,
        usage: responseJson?.usage,
        metadata: responseJson?.metadata,
    };
};

export const tokenPlaceChat = async (messages, options = {}) => {
    const result = await TokenPlaceChatV2(messages, options);
    return result.text;
};
