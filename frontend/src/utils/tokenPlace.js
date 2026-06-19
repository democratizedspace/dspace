import { loadGameState, ready } from './gameState/common.js';
import { buildChatPrompt, validateChatResponseText } from './openAI.js';
import {
    createMalformedTokenPlaceResponseError,
    createTokenPlaceHttpError,
    createTokenPlaceNetworkError,
} from './tokenPlaceErrors.js';

export const DEFAULT_TOKEN_PLACE_URL = 'https://token.place';
const DEFAULT_ORIGIN = DEFAULT_TOKEN_PLACE_URL;
const CHAT_COMPLETIONS_PATH = '/api/v1/chat/completions';
export const DEFAULT_TOKEN_PLACE_CHAT_MODEL = 'gpt-5-chat-latest';
const DEFAULT_CHAT_MODEL = DEFAULT_TOKEN_PLACE_CHAT_MODEL;
const METADATA_DENY_PATTERN =
    /(?:key|token|secret|credential|password|authorization|auth|inventory|save|state|player)/i;
const VALID_CHAT_ROLES = new Set(['user', 'assistant', 'system']);

const readEnvValue = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env[key];
    }
    return undefined;
};

export const stripTrailingSlashes = (value) =>
    String(value || '')
        .trim()
        .replace(/\/+$/g, '');

const isPlainObject = (value) =>
    Boolean(value) &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype;

export const resolveTokenPlaceBaseUrl = (options = {}) => {
    const state = options.state || loadGameState();
    const candidate =
        options.url ||
        state?.tokenPlace?.url ||
        options.runtimeUrl ||
        readEnvValue('VITE_TOKEN_PLACE_URL') ||
        DEFAULT_ORIGIN;
    let baseUrl = stripTrailingSlashes(candidate) || DEFAULT_ORIGIN;

    baseUrl = baseUrl.replace(/\/api\/v1\/chat\/completions$/i, '');
    baseUrl = baseUrl.replace(/\/api\/v1$/i, '');
    baseUrl = baseUrl.replace(/\/api$/i, '');

    return stripTrailingSlashes(baseUrl) || DEFAULT_ORIGIN;
};

export const buildTokenPlaceChatCompletionsUrl = (baseUrl) =>
    `${resolveTokenPlaceBaseUrl({ url: baseUrl })}${CHAT_COMPLETIONS_PATH}`;

export const getTokenPlaceChatModel = (options = {}) =>
    String(
        options.model ||
            options.runtimeModel ||
            readEnvValue('VITE_TOKEN_PLACE_CHAT_MODEL') ||
            DEFAULT_CHAT_MODEL
    ).trim() || DEFAULT_CHAT_MODEL;

const sanitizeChatMessage = (message) => ({
    role: VALID_CHAT_ROLES.has(message?.role) ? message.role : 'user',
    content:
        typeof message?.content === 'string' ? message.content : String(message?.content || ''),
});

export const sanitizeTokenPlaceMessages = (messages = []) =>
    (Array.isArray(messages) ? messages : []).map(sanitizeChatMessage);

const sanitizeMetadataValue = (value) => {
    if (typeof value === 'string') return value.slice(0, 200);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return undefined;
};

export const buildTokenPlaceMetadata = (metadata = {}) => {
    const safeMetadata = {};

    if (isPlainObject(metadata)) {
        Object.entries(metadata).forEach(([key, value]) => {
            if (!key || METADATA_DENY_PATTERN.test(key)) return;
            const safeValue = sanitizeMetadataValue(value);
            if (safeValue !== undefined) {
                safeMetadata[key] = safeValue;
            }
        });
    }

    return {
        ...safeMetadata,
        client: 'dspace',
        provider: 'token.place',
    };
};

export const extractTokenPlaceAssistantText = (response) => {
    const content = response?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: missing assistant content.'
        );
    }
    return content;
};

const parseErrorPayload = async (response) => {
    try {
        return await response.json();
    } catch {
        try {
            return { message: await response.text() };
        } catch {
            return { message: response.statusText };
        }
    }
};

export const TokenPlaceChatV2 = async (messages, options = {}) => {
    await ready;
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const contextSources = Array.isArray(promptPayload.contextSources)
        ? promptPayload.contextSources
        : [];
    const requestBody = {
        model: getTokenPlaceChatModel(options),
        messages: sanitizeTokenPlaceMessages(promptPayload.combinedMessages),
        metadata: buildTokenPlaceMetadata(options.metadata),
    };

    const baseUrl = resolveTokenPlaceBaseUrl({
        state: promptPayload.gameState,
        runtimeUrl: options.runtimeUrl,
        url: options.url,
    });
    const url = `${baseUrl}${CHAT_COMPLETIONS_PATH}`;

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: options.signal,
            credentials: 'omit',
        });
    } catch (error) {
        throw createTokenPlaceNetworkError(error);
    }

    if (!response.ok) {
        const errorPayload = await parseErrorPayload(response);
        throw createTokenPlaceHttpError(response.status, errorPayload, response.statusText);
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: invalid JSON.'
        );
    }

    const outputText = extractTokenPlaceAssistantText(data);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return {
        text,
        contextSources,
        usage: data?.usage,
        metadata: data?.metadata,
    };
};

export const tokenPlaceChat = async (messages, options = {}) => {
    const result = await TokenPlaceChatV2(messages, options);
    return result.text;
};
