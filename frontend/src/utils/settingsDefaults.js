export const DEFAULT_CHAT_PROVIDER = 'token-place';
export const CHAT_PROVIDER_VALUES = new Set([DEFAULT_CHAT_PROVIDER, 'openai']);

export const DEFAULT_SETTINGS = {
    chatProvider: DEFAULT_CHAT_PROVIDER,
    showChatDebugPayload: false,
    tokenPlaceTokenLite: false,
    showQuestGraphVisualizer: false,
};

export const normalizeSettings = (settings = {}, deploymentDefault = DEFAULT_CHAT_PROVIDER) => {
    const fallbackProvider = CHAT_PROVIDER_VALUES.has(deploymentDefault)
        ? deploymentDefault
        : DEFAULT_CHAT_PROVIDER;
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };
    const savedProvider = settings && typeof settings === 'object' ? settings.chatProvider : null;
    const chatProvider = CHAT_PROVIDER_VALUES.has(savedProvider) ? savedProvider : fallbackProvider;

    return {
        ...base,
        chatProvider,
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        tokenPlaceTokenLite: Boolean(base.tokenPlaceTokenLite),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
