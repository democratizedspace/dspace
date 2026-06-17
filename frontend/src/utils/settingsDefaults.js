export const DEFAULT_SETTINGS = {
    chatProvider: 'token-place',
    showChatDebugPayload: false,
    showQuestGraphVisualizer: false,
};

const ALLOWED_CHAT_PROVIDERS = new Set(['token-place', 'openai']);

export const normalizeChatProvider = (provider) =>
    ALLOWED_CHAT_PROVIDERS.has(provider) ? provider : DEFAULT_SETTINGS.chatProvider;

export const normalizeSettings = (settings = {}) => {
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };

    return {
        ...base,
        chatProvider: normalizeChatProvider(base.chatProvider),
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
