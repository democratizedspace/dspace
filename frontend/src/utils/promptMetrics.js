const textEncoder = new TextEncoder();

export const PROMPT_COMPONENTS = Object.freeze({
    systemInstructions: 'systemInstructions',
    rag: 'rag',
    playerState: 'playerState',
    chatHistory: 'chatHistory',
    latestUserMessage: 'latestUserMessage',
});

export const summarizeTextSize = (value) => {
    const text = typeof value === 'string' ? value : value == null ? '' : String(value);
    return {
        characters: text.length,
        utf8Bytes: textEncoder.encode(text).byteLength,
    };
};

const emptyComponentTotals = () =>
    Object.fromEntries(
        Object.values(PROMPT_COMPONENTS).map((component) => [
            component,
            { messageCount: 0, characters: 0, utf8Bytes: 0 },
        ])
    );

const addSize = (target, size) => {
    target.messageCount += 1;
    target.characters += size.characters;
    target.utf8Bytes += size.utf8Bytes;
};

export const buildPromptMetrics = (promptPayload, metadata = {}) => {
    const messages = Array.isArray(promptPayload?.combinedMessages)
        ? promptPayload.combinedMessages
        : Array.isArray(promptPayload?.messages)
          ? promptPayload.messages
          : [];
    const componentByMessageIndex = metadata.componentByMessageIndex || {};
    const componentTotals = emptyComponentTotals();
    const roleCounts = {};
    let totalCharacters = 0;
    let totalUtf8Bytes = 0;

    const perMessage = messages.map((message, index) => {
        const role = typeof message?.role === 'string' ? message.role : 'unknown';
        const size = summarizeTextSize(message?.content);
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        totalCharacters += size.characters;
        totalUtf8Bytes += size.utf8Bytes;
        const component = componentByMessageIndex[index];
        if (component && componentTotals[component]) {
            addSize(componentTotals[component], size);
        }
        return { index, role, characters: size.characters, utf8Bytes: size.utf8Bytes };
    });

    return {
        messageCount: messages.length,
        roleCounts,
        totalCharacters,
        totalUtf8Bytes,
        perMessage,
        componentTotals,
        timingsMs: {
            promptBuild: Number.isFinite(metadata.promptBuildMs) ? metadata.promptBuildMs : null,
            rag: Number.isFinite(metadata.ragMs) ? metadata.ragMs : null,
        },
    };
};
