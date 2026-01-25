export const DEFAULT_SETTINGS = {
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
        showChatDebugPayload: Boolean(base.showChatDebugPayload),
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
    };
};
