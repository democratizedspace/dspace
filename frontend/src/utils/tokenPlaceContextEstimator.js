import { sanitizeTokenPlaceMessages } from './tokenPlaceMessages.js';

export const TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION = 'dspace-token-place-context-estimator-v1';

export const TOKEN_PLACE_CONTEXT_TIERS = Object.freeze({
    '8k-fast': Object.freeze({ id: '8k-fast', totalContextTokens: 8_192 }),
    '64k-full': Object.freeze({ id: '64k-full', totalContextTokens: 65_536 }),
});

export const TOKEN_PLACE_DEFAULT_RESERVED_OUTPUT_TOKENS = 512;
export const TOKEN_PLACE_CHAT_TEMPLATE_BASE_TOKENS = 16;
export const TOKEN_PLACE_CHAT_TEMPLATE_TOKENS_PER_MESSAGE = 6;
export const TOKEN_PLACE_ESTIMATOR_BYTES_PER_TOKEN = 3;
export const TOKEN_PLACE_SAFETY_MARGIN_RATIO = 0.1;
export const TOKEN_PLACE_MIN_SAFETY_MARGIN_TOKENS = 256;

const textEncoder = new TextEncoder();

const utf8ByteLength = (value) => textEncoder.encode(String(value ?? '')).length;

const positiveIntegerOrDefault = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.ceil(number) : fallback;
};

export const estimateTokenPlacePromptTokens = (messages = []) => {
    const sanitizedMessages = sanitizeTokenPlaceMessages(messages);
    const contentTokens = sanitizedMessages.reduce(
        (sum, message) =>
            sum +
            Math.ceil(utf8ByteLength(message.content) / TOKEN_PLACE_ESTIMATOR_BYTES_PER_TOKEN),
        0
    );
    const templateTokens =
        TOKEN_PLACE_CHAT_TEMPLATE_BASE_TOKENS +
        sanitizedMessages.length * TOKEN_PLACE_CHAT_TEMPLATE_TOKENS_PER_MESSAGE;
    return contentTokens + templateTokens;
};

export const classifyTokenPlaceContextTier = (messages = [], options = {}) => {
    const sanitizedMessages = sanitizeTokenPlaceMessages(messages);
    const estimatedPromptTokens = estimateTokenPlacePromptTokens(sanitizedMessages);
    const reservedOutputTokens = positiveIntegerOrDefault(
        options.reservedOutputTokens,
        TOKEN_PLACE_DEFAULT_RESERVED_OUTPUT_TOKENS
    );
    const safetyMarginTokens = positiveIntegerOrDefault(
        options.safetyMarginTokens,
        Math.max(
            TOKEN_PLACE_MIN_SAFETY_MARGIN_TOKENS,
            Math.ceil(
                (estimatedPromptTokens + reservedOutputTokens) * TOKEN_PLACE_SAFETY_MARGIN_RATIO
            )
        )
    );
    const estimatedTotalTokens = estimatedPromptTokens + reservedOutputTokens + safetyMarginTokens;
    const selectedTier =
        estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].totalContextTokens
            ? TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].id
            : estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIERS['64k-full'].totalContextTokens
              ? TOKEN_PLACE_CONTEXT_TIERS['64k-full'].id
              : null;

    return {
        estimatedPromptTokens,
        reservedOutputTokens,
        safetyMarginTokens,
        estimatedTotalTokens,
        selectedTier,
        overLimit: selectedTier === null,
        estimatorVersion: TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
    };
};
