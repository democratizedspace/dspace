export const CHAT_PROVIDER_VALUES = ['token-place', 'openai'];
export const DEFAULT_CHAT_PROVIDER = 'token-place';

export const DEFAULT_SETTINGS = {
    chatProvider: DEFAULT_CHAT_PROVIDER,
    showChatDebugPayload: false,
    showQuestGraphVisualizer: false,
};

export const normalizeSettings = (settings = {}) => {
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };

    return {
        ...base,
        chatProvider: CHAT_PROVIDER_VALUES.includes(base.chatProvider)
            ? base.chatProvider
            : DEFAULT_CHAT_PROVIDER,
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
