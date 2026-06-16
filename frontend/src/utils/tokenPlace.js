import { loadGameState, ready } from './gameState/common.js';
import { buildChatPrompt, validateChatResponseText } from './openAI.js';

const DEFAULT_TOKEN_PLACE_ORIGIN = 'https://token.place';
const TOKEN_PLACE_CHAT_COMPLETIONS_PATH = '/api/v1/chat/completions';
const DEFAULT_TOKEN_PLACE_CHAT_MODEL = 'gpt-5-chat-latest';
const SENSITIVE_METADATA_KEY_PATTERN =
    /(api[_-]?key|authorization|auth|bearer|credential|secret|token|password|openai|save|inventory|playerstate|game[_-]?state)/i;

const isPlainObject = (value) =>
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype;

const readEnvValue = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env[key];
    }
    return undefined;
};

const normalizeTokenPlaceUrl = (value) => {
    const rawValue = typeof value === 'string' ? value.trim() : '';
    if (!rawValue) return DEFAULT_TOKEN_PLACE_ORIGIN;

    const withoutTrailingSlashes = rawValue.replace(/\/+$/g, '');
    const withoutChatPath = withoutTrailingSlashes
        .replace(/\/api\/v1\/chat\/completions$/i, '')
        .replace(/\/api\/chat$/i, '')
        .replace(/\/chat$/i, '')
        .replace(/\/api$/i, '');

    return withoutChatPath || DEFAULT_TOKEN_PLACE_ORIGIN;
};

export const resolveTokenPlaceBaseUrl = (options = {}) => {
    const state = options.state ?? loadGameState();
    const stateUrl = state?.tokenPlace?.url;
    const envUrl = readEnvValue('VITE_TOKEN_PLACE_URL');
    return normalizeTokenPlaceUrl(stateUrl || envUrl || DEFAULT_TOKEN_PLACE_ORIGIN);
};

export const buildTokenPlaceChatCompletionsUrl = (options = {}) =>
    `${resolveTokenPlaceBaseUrl(options)}${TOKEN_PLACE_CHAT_COMPLETIONS_PATH}`;

export const getTokenPlaceChatModel = () =>
    readEnvValue('VITE_TOKEN_PLACE_CHAT_MODEL')?.trim() || DEFAULT_TOKEN_PLACE_CHAT_MODEL;

export const isTokenPlaceEnabled = () => true;

export const buildTokenPlaceMetadata = (metadata = {}) => {
    const safeMetadata = {
        client: 'dspace',
        provider: 'token.place',
    };

    if (!isPlainObject(metadata)) return safeMetadata;

    Object.entries(metadata).forEach(([key, value]) => {
        if (!key || SENSITIVE_METADATA_KEY_PATTERN.test(key)) return;
        if (value === null || value === undefined) return;
        if (['string', 'number', 'boolean'].includes(typeof value)) {
            safeMetadata[key] = value;
        }
    });

    return safeMetadata;
};

export const extractTokenPlaceAssistantText = (responseBody) => {
    const content = responseBody?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        const error = new Error('token.place returned a malformed chat response.');
        error.name = 'TokenPlaceMalformedResponseError';
        error.tokenPlaceType = 'malformed_response';
        throw error;
    }
    return content;
};

const buildTokenPlaceProviderError = (response, errorBody) => {
    const providerError = errorBody?.error && isPlainObject(errorBody.error) ? errorBody.error : {};
    const message =
        typeof providerError.message === 'string' && providerError.message.trim()
            ? providerError.message
            : `token.place API v1 request failed with status ${response.status}.`;
    const error = new Error(message);
    error.name = 'TokenPlaceProviderError';
    error.status = response.status;
    error.statusText = response.statusText;
    error.type = providerError.type;
    error.code = providerError.code;
    error.param = providerError.param;
    error.providerError = providerError;
    return error;
};

const parseTokenPlaceResponseBody = async (response) => {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

export const TokenPlaceChatV2 = async (messages, options = {}) => {
    await ready;
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const { combinedMessages, contextSources } = promptPayload;
    const metadata = buildTokenPlaceMetadata(options.metadata);
    const body = {
        model: getTokenPlaceChatModel(),
        messages: combinedMessages,
        metadata,
    };

    const response = await fetch(
        buildTokenPlaceChatCompletionsUrl({ state: promptPayload.gameState }),
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: options.signal,
        }
    );

    const responseBody = await parseTokenPlaceResponseBody(response);

    if (!response.ok) {
        throw buildTokenPlaceProviderError(response, responseBody);
    }

    const outputText = extractTokenPlaceAssistantText(responseBody);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return {
        text,
        contextSources: Array.isArray(contextSources) ? contextSources : [],
        usage: responseBody?.usage,
        metadata: responseBody?.metadata,
    };
};

export const tokenPlaceChat = async (messages, options = {}) => {
    const response = await TokenPlaceChatV2(messages, options);
    return response.text;
};
