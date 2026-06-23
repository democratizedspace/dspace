const utf8Encoder = new TextEncoder();

const COMPONENT_KEYS = [
    'systemInstructions',
    'rag',
    'playerState',
    'chatHistory',
    'latestUserMessage',
];

const toContentString = (content) => {
    if (typeof content === 'string') return content;
    if (content == null) return '';
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (typeof part?.text === 'string') return part.text;
                if (typeof part?.content === 'string') return part.content;
                return '';
            })
            .join('\n');
    }
    return '';
};

const summarizeText = (text) => ({
    characters: text.length,
    utf8Bytes: utf8Encoder.encode(text).byteLength,
});

const emptyComponentTotals = () =>
    Object.fromEntries(
        COMPONENT_KEYS.map((key) => [key, { messages: 0, characters: 0, utf8Bytes: 0 }])
    );

const normalizeComponent = (component) => (COMPONENT_KEYS.includes(component) ? component : null);

export const createPromptMetrics = (promptPayload, metadata = {}) => {
    const messages = Array.isArray(promptPayload?.combinedMessages)
        ? promptPayload.combinedMessages
        : Array.isArray(promptPayload?.messages)
          ? promptPayload.messages
          : [];
    const roleCounts = {};
    const componentTotals = emptyComponentTotals();
    const latestUserIndex = messages.reduce(
        (latest, message, index) => (message?.role === 'user' ? index : latest),
        -1
    );
    const componentByIndex = new Map(
        Array.isArray(metadata.components)
            ? metadata.components
                  .filter((entry) => Number.isInteger(entry?.index))
                  .map((entry) => [entry.index, normalizeComponent(entry.component)])
            : []
    );

    const perMessage = messages.map((message, index) => {
        const role = typeof message?.role === 'string' && message.role ? message.role : 'unknown';
        const content = toContentString(message?.content);
        const summary = summarizeText(content);
        const component =
            componentByIndex.get(index) ||
            (message?.kind === 'rag' ? 'rag' : null) ||
            (index === latestUserIndex ? 'latestUserMessage' : null) ||
            (role === 'system' ? 'systemInstructions' : null) ||
            (index < latestUserIndex ? 'chatHistory' : null);

        roleCounts[role] = (roleCounts[role] || 0) + 1;
        if (component) {
            componentTotals[component].messages += 1;
            componentTotals[component].characters += summary.characters;
            componentTotals[component].utf8Bytes += summary.utf8Bytes;
        }

        return {
            index,
            role,
            component,
            characters: summary.characters,
            utf8Bytes: summary.utf8Bytes,
        };
    });

    return {
        messageCount: messages.length,
        roleCounts,
        totalCharacters: perMessage.reduce((total, message) => total + message.characters, 0),
        totalUtf8Bytes: perMessage.reduce((total, message) => total + message.utf8Bytes, 0),
        perMessage,
        componentTotals,
        timingsMs: {
            promptBuild: Number.isFinite(metadata.promptBuildDurationMs)
                ? metadata.promptBuildDurationMs
                : null,
            rag: Number.isFinite(metadata.ragDurationMs) ? metadata.ragDurationMs : null,
        },
    };
};

export const PROMPT_METRIC_COMPONENTS = COMPONENT_KEYS;
