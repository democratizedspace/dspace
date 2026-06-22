export const DEFAULT_CHAT_PROVIDER = 'token-place';
export const CHAT_PROVIDER_VALUES = new Set([DEFAULT_CHAT_PROVIDER, 'openai']);

export const DEFAULT_SETTINGS = {
    chatProvider: DEFAULT_CHAT_PROVIDER,
    showChatDebugPayload: false,
    tokenPlaceTokenLite: false,
    showQuestGraphVisualizer: false,
};

export const normalizeSettings = (settings = {}) => {
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };
    const chatProvider = CHAT_PROVIDER_VALUES.has(base.chatProvider)
        ? base.chatProvider
        : DEFAULT_CHAT_PROVIDER;

    return {
        ...base,
        chatProvider,
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        tokenPlaceTokenLite: Boolean(base.tokenPlaceTokenLite),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
