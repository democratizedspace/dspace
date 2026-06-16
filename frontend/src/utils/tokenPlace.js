import { loadGameState, ready } from './gameState/common.js';
import { buildChatPrompt, validateChatResponseText } from './openAI.js';
import { createTokenPlaceError } from './tokenPlaceErrors.js';

const DEFAULT_URL = 'https://token.place';
const CHAT_COMPLETIONS_PATH = '/api/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-5-chat-latest';
const SAFE_METADATA_KEY_PATTERN =
    /^(client|provider|conversation_id|conversationId|request_id|requestId|source)$/;
const SECRET_METADATA_KEY_PATTERN =
    /key|token|secret|password|credential|authorization|auth|save|inventory|player/i;

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
    Boolean(value) &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype;

export const isTokenPlaceEnabled = () => true;

export const resolveTokenPlaceBaseUrl = (options = {}) => {
    const state = options.state || loadGameState();
    const configuredUrl =
        state?.tokenPlace?.url || readEnvValue('VITE_TOKEN_PLACE_URL') || DEFAULT_URL;
    let baseUrl = String(configuredUrl).trim() || DEFAULT_URL;
    baseUrl = baseUrl.replace(/\/+$/, '');
    baseUrl = baseUrl.replace(/\/api(?:\/v\d+)?(?:\/chat\/completions)?$/i, '');
    return baseUrl || DEFAULT_URL;
};

export const buildTokenPlaceChatCompletionsUrl = (options = {}) =>
    `${resolveTokenPlaceBaseUrl(options)}${CHAT_COMPLETIONS_PATH}`;

export const getTokenPlaceChatModel = () =>
    readEnvValue('VITE_TOKEN_PLACE_CHAT_MODEL')?.trim() || DEFAULT_MODEL;

export const buildTokenPlaceMetadata = (metadata = {}) => {
    const safeMetadata = { client: 'dspace', provider: 'token.place' };
    if (!isPlainObject(metadata)) return safeMetadata;

    Object.entries(metadata).forEach(([key, value]) => {
        if (!SAFE_METADATA_KEY_PATTERN.test(key) || SECRET_METADATA_KEY_PATTERN.test(key)) return;
        if (['string', 'number', 'boolean'].includes(typeof value) || value === null) {
            safeMetadata[key] = value;
        }
    });

    return safeMetadata;
};

export const extractTokenPlaceAssistantText = (responseData) => {
    const content = responseData?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        throw createTokenPlaceError(
            'malformed',
            'Malformed token.place response: missing assistant content.'
        );
    }
    return content;
};

const parseResponseJson = async (response) => {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

const throwForResponseError = (response, data) => {
    const structuredError = isPlainObject(data?.error) ? data.error : {};
    throw createTokenPlaceError('provider', 'token.place API request failed.', {
        status: response.status,
        code: structuredError.code,
        param: structuredError.param,
        providerMessage: structuredError.message,
        type: structuredError.type || 'provider',
    });
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

    if (options.stream === true) {
        body.stream = false;
    }

    let response;
    try {
        response = await fetch(
            buildTokenPlaceChatCompletionsUrl({ state: promptPayload.gameState }),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: options.signal,
            }
        );
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw createTokenPlaceError('abort', 'token.place request was aborted.', {
                cause: error,
            });
        }
        throw createTokenPlaceError('network', 'Failed to reach token.place.', { cause: error });
    }

    const data = await parseResponseJson(response);
    if (!response.ok) {
        throwForResponseError(response, data);
    }

    const outputText = extractTokenPlaceAssistantText(data);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return {
        text,
        contextSources: Array.isArray(contextSources) ? contextSources : [],
        usage: data?.usage,
        metadata: data?.metadata,
    };
};

export const tokenPlaceChat = async (messages, options = {}) => {
    const response = await TokenPlaceChatV2(messages, options);
    return response.text;
};
