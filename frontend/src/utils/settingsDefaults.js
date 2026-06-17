export const CHAT_PROVIDER_TOKEN_PLACE = 'token-place';
export const CHAT_PROVIDER_OPENAI = 'openai';

const CHAT_PROVIDER_VALUES = new Set([CHAT_PROVIDER_TOKEN_PLACE, CHAT_PROVIDER_OPENAI]);

export const DEFAULT_SETTINGS = {
    chatProvider: CHAT_PROVIDER_TOKEN_PLACE,
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
        chatProvider: CHAT_PROVIDER_VALUES.has(base.chatProvider)
            ? base.chatProvider
            : CHAT_PROVIDER_TOKEN_PLACE,
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
