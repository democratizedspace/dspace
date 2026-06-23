const utf8ByteLength = (value) => new TextEncoder().encode(String(value ?? '')).length;

const summarizeText = (value) => {
    const text = String(value ?? '');
    return {
        characters: text.length,
        utf8Bytes: utf8ByteLength(text),
    };
};

const emptyComponentTotals = () => ({
    systemInstructions: { characters: 0, utf8Bytes: 0 },
    rag: { characters: 0, utf8Bytes: 0 },
    playerState: { characters: 0, utf8Bytes: 0 },
    chatHistory: { characters: 0, utf8Bytes: 0 },
    latestUserMessage: { characters: 0, utf8Bytes: 0 },
});

const addSize = (target, size) => {
    target.characters += size.characters;
    target.utf8Bytes += size.utf8Bytes;
};

export const buildPromptMetrics = (promptPayload, metadata = {}) => {
    const messages = Array.isArray(promptPayload?.combinedMessages)
        ? promptPayload.combinedMessages
        : Array.isArray(promptPayload?.messages)
          ? promptPayload.messages
          : [];
    const roleCounts = {};
    const perMessage = messages.map((message, index) => {
        const role = typeof message?.role === 'string' ? message.role : 'unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        const size = summarizeText(message?.content);
        return { index, role, ...size };
    });
    const totalCharacters = perMessage.reduce((sum, message) => sum + message.characters, 0);
    const totalUtf8Bytes = perMessage.reduce((sum, message) => sum + message.utf8Bytes, 0);
    const componentTotals = emptyComponentTotals();

    for (const [name, value] of Object.entries(metadata.components || {})) {
        if (!Object.prototype.hasOwnProperty.call(componentTotals, name)) continue;
        if (Array.isArray(value)) {
            for (const entry of value) addSize(componentTotals[name], summarizeText(entry));
        } else {
            addSize(componentTotals[name], summarizeText(value));
        }
    }

    return {
        messageCount: messages.length,
        roleCounts,
        totalCharacters,
        totalUtf8Bytes,
        perMessage,
        componentTotals,
        promptBuildDurationMs: Number(metadata.promptBuildDurationMs || 0),
        ragDurationMs:
            metadata.ragDurationMs === undefined || metadata.ragDurationMs === null
                ? null
                : Number(metadata.ragDurationMs),
    };
};
