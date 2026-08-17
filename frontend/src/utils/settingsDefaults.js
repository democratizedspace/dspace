export const DEFAULT_CHAT_PROVIDER = 'token-place';
export const CHAT_PROVIDER_VALUES = new Set([DEFAULT_CHAT_PROVIDER, 'openai']);

export const isValidChatProvider = (provider) => CHAT_PROVIDER_VALUES.has(provider);

export const DEFAULT_SETTINGS = {
    chatProvider: DEFAULT_CHAT_PROVIDER,
    showChatDebugPayload: false,
    tokenPlaceTokenLite: false,
    showQuestGraphVisualizer: false,
};

export const normalizeSettings = (settings = {}, deploymentDefault = DEFAULT_CHAT_PROVIDER) => {
    const fallbackProvider = isValidChatProvider(deploymentDefault)
        ? deploymentDefault
        : DEFAULT_CHAT_PROVIDER;
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };
    const chatProvider = isValidChatProvider(settings?.chatProvider)
        ? settings.chatProvider
        : fallbackProvider;

    return {
        ...base,
        chatProvider,
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        tokenPlaceTokenLite: Boolean(base.tokenPlaceTokenLite),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
