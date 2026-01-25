export const DEFAULT_SETTINGS = {
    showQuestGraphVisualizer: false,
    showChatPromptDebug: false,
};

export const normalizeSettings = (settings = {}) => {
    const base =
        settings && typeof settings === 'object'
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };

    return {
        ...base,
        showQuestGraphVisualizer: Boolean(base.showQuestGraphVisualizer),
        showChatPromptDebug: Boolean(base.showChatPromptDebug),
    };
};
