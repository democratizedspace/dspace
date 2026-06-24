import { sanitizeTokenPlaceMessagesWithMetadata } from './tokenPlaceMessages.js';

// Bump this version string whenever any estimation constant or formula below changes so
// callers, benchmarks, and tests can detect heuristic drift.
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

const toApiV1MessagePayload = (messages) =>
    messages.map((message) => ({
        role: typeof message?.role === 'string' ? message.role : 'user',
        content: String(message?.content ?? ''),
    }));

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
    const sanitizedMessages = toApiV1MessagePayload(Array.isArray(messages) ? messages : []);
    const serializedPayload = JSON.stringify(sanitizedMessages);
    const payloadUtf8Bytes = utf8ByteLength(serializedPayload);
    const perMessage = sanitizedMessages.map((message, index) => {
        const role = message.role;
        const contentUtf8Bytes = utf8ByteLength(message.content);
        const roleUtf8Bytes = utf8ByteLength(role);
        const serializedUtf8Bytes = utf8ByteLength(JSON.stringify(message));
        return {
            index,
            role,
            contentUtf8Bytes,
            roleUtf8Bytes,
            utf8Bytes: contentUtf8Bytes + roleUtf8Bytes,
            serializedUtf8Bytes,
        };
    });
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

const summarizeShaping = (messages, sanitizedMessages) => {
    const sourceMessages = Array.isArray(messages) ? messages : [];
    const sourcePayload = toApiV1MessagePayload(sourceMessages);
    const sanitizedPayload = toApiV1MessagePayload(sanitizedMessages);
    const sourceContentChars = sourcePayload.reduce(
        (sum, message) => sum + message.content.length,
        0
    );
    const sanitizedContentChars = sanitizedPayload.reduce(
        (sum, message) => sum + message.content.length,
        0
    );
    const sourceIndexes = new Set(
        sanitizedMessages
            .map((message) => message.originalIndex)
            .filter((index) => Number.isInteger(index) && index >= 0)
    );
    const chunkedSourceIndexes = new Set(
        sanitizedMessages
            .filter((message) => Number.isInteger(message.chunkIndex) && message.chunkIndex > 0)
            .map((message) => message.originalIndex)
    );
    const changed = JSON.stringify(sourcePayload) !== JSON.stringify(sanitizedPayload);

    return {
        changed,
        sourceMessageCount: sourceMessages.length,
        sanitizedMessageCount: sanitizedPayload.length,
        droppedMessageCount: Math.max(0, sourceMessages.length - sourceIndexes.size),
        chunkedSourceMessageCount: chunkedSourceIndexes.size,
        sourceContentChars,
        sanitizedContentChars,
        discardedContentChars: Math.max(0, sourceContentChars - sanitizedContentChars),
    };
};

export const estimateTokenPlaceContext = (messages = [], options = {}) => {
    const sanitizedMessagesWithMetadata = sanitizeTokenPlaceMessagesWithMetadata(messages);
    const result = estimateTokenPlaceContextForSanitizedMessages(
        sanitizedMessagesWithMetadata,
        options
    );
    return {
        ...result,
        sanitizedPayload: summarizeShaping(messages, sanitizedMessagesWithMetadata),
    };
};
