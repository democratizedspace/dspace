const textEncoder = new TextEncoder();
const COMPONENT_NAMES = [
    'systemInstructions',
    'rag',
    'playerState',
    'chatHistory',
    'latestUserMessage',
];

const byteLength = (value) => textEncoder.encode(String(value || '')).byteLength;

const summarizeText = (text) => {
    const content = String(text || '');
    return {
        characters: content.length,
        utf8Bytes: byteLength(content),
    };
};

const emptyComponent = () => ({ messages: 0, characters: 0, utf8Bytes: 0 });

const normalizeComponentName = (name) => {
    if (name === 'system') return 'systemInstructions';
    if (name === 'system-instructions') return 'systemInstructions';
    if (name === 'player-state') return 'playerState';
    if (name === 'latest-user') return 'latestUserMessage';
    if (COMPONENT_NAMES.includes(name)) return name;
    return null;
};

const addComponentText = (totals, component, text) => {
    const name = normalizeComponentName(component);
    if (!name) return;
    const summary = summarizeText(text);
    totals[name].messages += 1;
    totals[name].characters += summary.characters;
    totals[name].utf8Bytes += summary.utf8Bytes;
};

export const collectPromptMetrics = (promptPayload, metadata = {}) => {
    const sourceMessages = Array.isArray(promptPayload?.combinedMessages)
        ? promptPayload.combinedMessages
        : Array.isArray(promptPayload?.messages)
          ? promptPayload.messages
          : [];
    const messages = sourceMessages.map((message, index) => {
        const role = typeof message?.role === 'string' ? message.role : 'unknown';
        const summary = summarizeText(message?.content);
        return { index, role, ...summary };
    });
    const roleCounts = messages.reduce((counts, message) => {
        counts[message.role] = (counts[message.role] || 0) + 1;
        return counts;
    }, {});
    const componentTotals = Object.fromEntries(
        COMPONENT_NAMES.map((name) => [name, emptyComponent()])
    );

    for (const component of Array.isArray(metadata.components) ? metadata.components : []) {
        addComponentText(componentTotals, component?.name, component?.content);
    }

    if (metadata.componentByMessageIndex && typeof metadata.componentByMessageIndex === 'object') {
        sourceMessages.forEach((message, index) => {
            addComponentText(
                componentTotals,
                metadata.componentByMessageIndex[index],
                message?.content
            );
        });
    }

    return {
        messageCount: messages.length,
        roleCounts,
        totalCharacters: messages.reduce((total, message) => total + message.characters, 0),
        totalUtf8Bytes: messages.reduce((total, message) => total + message.utf8Bytes, 0),
        messages,
        componentTotals,
        timings: {
            promptBuildMs: Number.isFinite(metadata.promptBuildMs) ? metadata.promptBuildMs : null,
            ragMs: Number.isFinite(metadata.ragMs) ? metadata.ragMs : null,
        },
    };
};
