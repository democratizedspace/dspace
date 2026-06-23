const textEncoder = new TextEncoder();

export const TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION = 'dspace-context-estimator-v1';
export const TOKEN_PLACE_CONTEXT_TIERS = Object.freeze({
    '8k-fast': Object.freeze({ id: '8k-fast', totalContextTokens: 8_192 }),
    '64k-full': Object.freeze({ id: '64k-full', totalContextTokens: 65_536 }),
});

export const DEFAULT_TOKEN_PLACE_OUTPUT_TOKEN_RESERVATION = 512;
export const TOKEN_PLACE_CHAT_TEMPLATE_BASE_TOKENS = 16;
export const TOKEN_PLACE_CHAT_TEMPLATE_TOKENS_PER_MESSAGE = 8;
export const TOKEN_PLACE_ESTIMATED_BYTES_PER_TOKEN = 3;
export const TOKEN_PLACE_SAFETY_MARGIN_RATIO = 0.08;
export const TOKEN_PLACE_MIN_SAFETY_MARGIN_TOKENS = 256;

const byteLength = (value) => textEncoder.encode(String(value ?? '')).length;

const stableApiV1MessagePayload = (messages = []) =>
    (Array.isArray(messages) ? messages : []).map((message) => ({
        role: typeof message?.role === 'string' ? message.role : 'user',
        content: String(message?.content ?? ''),
    }));

export const estimateTokenPlacePromptTokens = (messages = [], options = {}) => {
    const payload = stableApiV1MessagePayload(messages);
    const serializedPayload = JSON.stringify(payload);
    const payloadUtf8Bytes = byteLength(serializedPayload);
    const contentUtf8Bytes = payload.reduce((sum, message) => sum + byteLength(message.content), 0);
    const conservativeByteTokens = Math.ceil(
        payloadUtf8Bytes / (options.estimatedBytesPerToken ?? TOKEN_PLACE_ESTIMATED_BYTES_PER_TOKEN)
    );
    const chatTemplateOverheadTokens =
        (options.chatTemplateBaseTokens ?? TOKEN_PLACE_CHAT_TEMPLATE_BASE_TOKENS) +
        payload.length *
            (options.chatTemplateTokensPerMessage ?? TOKEN_PLACE_CHAT_TEMPLATE_TOKENS_PER_MESSAGE);

    return {
        estimatedPromptTokens: conservativeByteTokens + chatTemplateOverheadTokens,
        payloadUtf8Bytes,
        contentUtf8Bytes,
        messageCount: payload.length,
        chatTemplateOverheadTokens,
    };
};

const calculateSafetyMarginTokens = (estimatedPromptTokens, options = {}) => {
    if (Number.isFinite(options.safetyMarginTokens)) {
        return Math.max(0, Math.ceil(options.safetyMarginTokens));
    }
    const ratio = options.safetyMarginRatio ?? TOKEN_PLACE_SAFETY_MARGIN_RATIO;
    const minimum = options.minSafetyMarginTokens ?? TOKEN_PLACE_MIN_SAFETY_MARGIN_TOKENS;
    return Math.max(Math.ceil(estimatedPromptTokens * ratio), minimum);
};

export const classifyTokenPlaceContextTier = (messages = [], options = {}) => {
    const promptEstimate = estimateTokenPlacePromptTokens(messages, options);
    const reservedOutputTokens = Math.max(
        0,
        Math.ceil(options.reservedOutputTokens ?? DEFAULT_TOKEN_PLACE_OUTPUT_TOKEN_RESERVATION)
    );
    const safetyMarginTokens = calculateSafetyMarginTokens(
        promptEstimate.estimatedPromptTokens,
        options
    );
    const estimatedTotalTokens =
        promptEstimate.estimatedPromptTokens + reservedOutputTokens + safetyMarginTokens;
    const selectedTier =
        estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].totalContextTokens
            ? TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].id
            : estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIERS['64k-full'].totalContextTokens
              ? TOKEN_PLACE_CONTEXT_TIERS['64k-full'].id
              : null;

    return {
        estimatorVersion: TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
        estimatedPromptTokens: promptEstimate.estimatedPromptTokens,
        reservedOutputTokens,
        safetyMarginTokens,
        estimatedTotalTokens,
        selectedTier,
        overLimit: selectedTier === null,
        payloadUtf8Bytes: promptEstimate.payloadUtf8Bytes,
        contentUtf8Bytes: promptEstimate.contentUtf8Bytes,
        messageCount: promptEstimate.messageCount,
        chatTemplateOverheadTokens: promptEstimate.chatTemplateOverheadTokens,
    };
};
