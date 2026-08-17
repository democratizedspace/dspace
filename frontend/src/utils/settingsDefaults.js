export const DEFAULT_CHAT_PROVIDER = 'token-place';
export const CHAT_PROVIDER_VALUES = new Set([DEFAULT_CHAT_PROVIDER, 'openai']);

export const normalizeChatProvider = (provider, fallback = DEFAULT_CHAT_PROVIDER) =>
    CHAT_PROVIDER_VALUES.has(provider) ? provider : fallback;

export const DEFAULT_SETTINGS = {
    chatProvider: DEFAULT_CHAT_PROVIDER,
    showChatDebugPayload: false,
    tokenPlaceTokenLite: false,
    showQuestGraphVisualizer: false,
};

export const normalizeSettings = (settings = {}, deploymentDefault = DEFAULT_CHAT_PROVIDER) => {
    const resolvedDefault = normalizeChatProvider(deploymentDefault);
    const savedChatProvider =
        settings && typeof settings === 'object' ? settings.chatProvider : undefined;
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };
    const chatProvider = normalizeChatProvider(savedChatProvider, resolvedDefault);

    return {
        ...base,
        chatProvider,
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        tokenPlaceTokenLite: Boolean(base.tokenPlaceTokenLite),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
