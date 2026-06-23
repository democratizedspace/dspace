import { sanitizeTokenPlaceMessages } from './tokenPlaceMessages.js';

export const TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION = 'dspace-token-context-estimator-v1';
export const TOKEN_PLACE_CONTEXT_TIERS = Object.freeze({
    '8k-fast': Object.freeze({ id: '8k-fast', totalContextTokens: 8_192 }),
    '64k-full': Object.freeze({ id: '64k-full', totalContextTokens: 65_536 }),
});

export const DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS = 512;
export const TOKEN_PLACE_ESTIMATOR_BYTES_PER_TOKEN = 3;
export const TOKEN_PLACE_ESTIMATOR_PER_MESSAGE_OVERHEAD_TOKENS = 8;
export const TOKEN_PLACE_ESTIMATOR_CHAT_OVERHEAD_TOKENS = 16;
export const TOKEN_PLACE_ESTIMATOR_MIN_SAFETY_MARGIN_TOKENS = 256;
export const TOKEN_PLACE_ESTIMATOR_SAFETY_MARGIN_RATIO = 0.08;

const textEncoder = new TextEncoder();

const utf8ByteLength = (value) => textEncoder.encode(String(value ?? '')).length;

const normalizeReservation = (value) => {
    const tokens = Number(value);
    if (!Number.isFinite(tokens) || tokens < 0)
        return DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS;
    return Math.ceil(tokens);
};

const estimateContentTokensFromBytes = (bytes) =>
    Math.ceil(bytes / TOKEN_PLACE_ESTIMATOR_BYTES_PER_TOKEN);

const estimateChatTemplateOverhead = (messageCount) =>
    TOKEN_PLACE_ESTIMATOR_CHAT_OVERHEAD_TOKENS +
    messageCount * TOKEN_PLACE_ESTIMATOR_PER_MESSAGE_OVERHEAD_TOKENS;

const estimateSafetyMargin = (promptTokens, configuredMargin) => {
    if (configuredMargin !== undefined) {
        const tokens = Number(configuredMargin);
        if (Number.isFinite(tokens) && tokens >= 0) return Math.ceil(tokens);
    }
    return Math.max(
        TOKEN_PLACE_ESTIMATOR_MIN_SAFETY_MARGIN_TOKENS,
        Math.ceil(promptTokens * TOKEN_PLACE_ESTIMATOR_SAFETY_MARGIN_RATIO)
    );
};

const selectTier = (estimatedTotalTokens) => {
    if (estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].totalContextTokens) {
        return TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].id;
    }
    if (estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIERS['64k-full'].totalContextTokens) {
        return TOKEN_PLACE_CONTEXT_TIERS['64k-full'].id;
    }
    return null;
};

export const estimateTokenPlaceContextForSanitizedMessages = (messages = [], options = {}) => {
    const sanitizedMessages = Array.isArray(messages) ? messages : [];
    const perMessage = sanitizedMessages.map((message, index) => {
        const role = typeof message?.role === 'string' ? message.role : 'user';
        const contentUtf8Bytes = utf8ByteLength(message?.content);
        const roleUtf8Bytes = utf8ByteLength(role);
        return {
            index,
            role,
            contentUtf8Bytes,
            roleUtf8Bytes,
            utf8Bytes: contentUtf8Bytes + roleUtf8Bytes,
        };
    });
    const payloadUtf8Bytes = perMessage.reduce((sum, message) => sum + message.utf8Bytes, 0);
    const promptTokens =
        estimateContentTokensFromBytes(payloadUtf8Bytes) +
        estimateChatTemplateOverhead(sanitizedMessages.length);
    const reservedOutputTokens = normalizeReservation(options.reservedOutputTokens);
    const safetyMarginTokens = estimateSafetyMargin(promptTokens, options.safetyMarginTokens);
    const estimatedTotalTokens = promptTokens + reservedOutputTokens + safetyMarginTokens;
    const selectedTier = selectTier(estimatedTotalTokens);

    return {
        estimatedPromptTokens: promptTokens,
        reservedOutputTokens,
        safetyMarginTokens,
        estimatedTotalTokens,
        selectedTier,
        overLimit: selectedTier === null,
        estimatorVersion: TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
        payloadUtf8Bytes,
        messageCount: sanitizedMessages.length,
        perMessage,
    };
};

export const estimateTokenPlaceContext = (messages = [], options = {}) =>
    estimateTokenPlaceContextForSanitizedMessages(sanitizeTokenPlaceMessages(messages), options);
