const textEncoder = new TextEncoder();

export const TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION = 'dspace-token-place-context-estimator-v1';
export const TOKEN_PLACE_DEFAULT_OUTPUT_TOKEN_RESERVATION = 512;
export const TOKEN_PLACE_CONTEXT_SAFETY_MARGIN_RATIO = 0.08;
export const TOKEN_PLACE_CHAT_TEMPLATE_BASE_OVERHEAD_TOKENS = 8;
export const TOKEN_PLACE_CHAT_TEMPLATE_PER_MESSAGE_OVERHEAD_TOKENS = 12;

export const TOKEN_PLACE_CONTEXT_TIER_PROFILES = Object.freeze({
    '8k-fast': Object.freeze({ id: '8k-fast', totalContextTokens: 8_192 }),
    '64k-full': Object.freeze({ id: '64k-full', totalContextTokens: 65_536 }),
});

const normalizeMessages = (messages = []) => (Array.isArray(messages) ? messages : []);

const utf8ByteLength = (value) => textEncoder.encode(String(value ?? '')).length;

const estimateContentTokens = (content) => {
    const text = String(content ?? '');
    if (!text) return 0;
    const characters = text.length;
    const utf8Bytes = utf8ByteLength(text);

    // Conservative offline heuristic for Llama-family chat payloads:
    // - UTF-8 bytes catch non-ASCII cost that JS string length hides.
    // - characters/3 overestimates typical ASCII prose/code versus the common chars/4 planning
    //   shortcut.
    // - bytes/3 keeps Unicode and emoji payloads from being undercounted.
    // This is intentionally not an exact tokenizer and must not be used as compute admission.
    return Math.ceil(Math.max(characters, utf8Bytes) / 3);
};

const estimateMessageTokens = (message) =>
    estimateContentTokens(message?.content) + TOKEN_PLACE_CHAT_TEMPLATE_PER_MESSAGE_OVERHEAD_TOKENS;

const selectTier = (estimatedTotalTokens) => {
    if (estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIER_PROFILES['8k-fast'].totalContextTokens) {
        return TOKEN_PLACE_CONTEXT_TIER_PROFILES['8k-fast'].id;
    }
    if (estimatedTotalTokens <= TOKEN_PLACE_CONTEXT_TIER_PROFILES['64k-full'].totalContextTokens) {
        return TOKEN_PLACE_CONTEXT_TIER_PROFILES['64k-full'].id;
    }
    return null;
};

export const estimateTokenPlaceContext = (messages = [], options = {}) => {
    const normalizedMessages = normalizeMessages(messages);
    const reservedOutputTokens = Number.isFinite(options.reservedOutputTokens)
        ? Math.max(0, Math.ceil(options.reservedOutputTokens))
        : TOKEN_PLACE_DEFAULT_OUTPUT_TOKEN_RESERVATION;
    const contentAndMessageTokens = normalizedMessages.reduce(
        (sum, message) => sum + estimateMessageTokens(message),
        TOKEN_PLACE_CHAT_TEMPLATE_BASE_OVERHEAD_TOKENS
    );
    const estimatedPromptTokens = Math.ceil(contentAndMessageTokens);
    const safetyMarginTokens = Math.ceil(
        (estimatedPromptTokens + reservedOutputTokens) * TOKEN_PLACE_CONTEXT_SAFETY_MARGIN_RATIO
    );
    const estimatedTotalTokens = estimatedPromptTokens + reservedOutputTokens + safetyMarginTokens;
    const selectedTier = selectTier(estimatedTotalTokens);

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
