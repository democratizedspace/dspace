const VALID_CHAT_ROLES = new Set(['user', 'assistant', 'system']);
const normalizeTokenPlaceRole = (role) => (VALID_CHAT_ROLES.has(role) ? role : 'user');
export const TOKEN_PLACE_API_V1_MAX_MESSAGES = 64;
export const TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS = 32_768;
export const TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS = 131_072;
const TOKEN_PLACE_API_V1_CHUNK_LABEL_CHARS = 96;
const TOKEN_PLACE_API_V1_SYSTEM_CHUNK_CHARS =
    TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS - TOKEN_PLACE_API_V1_CHUNK_LABEL_CHARS;
const TOKEN_PLACE_API_V1_FALLBACK_MESSAGE = {
    role: 'user',
    content: 'Please continue.',
};

const stringifyJsonOrString = (content) => {
    try {
        const serialized = JSON.stringify(content);
        return typeof serialized === 'string' ? serialized : String(content);
    } catch {
        return String(content);
    }
};

const stringifyTokenPlaceContent = (content) => {
    if (typeof content === 'string') return content;
    if (content == null) return '';
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (typeof part?.text === 'string') return part.text;
                if (typeof part?.content === 'string') return part.content;
                return stringifyJsonOrString(part);
            })
            .filter(Boolean)
            .join('\n');
    }
    return stringifyJsonOrString(content);
};

const chunkText = (content, maxChars) => {
    const chunks = [];
    for (let offset = 0; offset < content.length; offset += maxChars) {
        chunks.push(content.slice(offset, offset + maxChars));
    }
    return chunks;
};

const splitTokenPlaceMessage = (message, index) => {
    const role = normalizeTokenPlaceRole(message?.role);
    const content = stringifyTokenPlaceContent(message?.content).trim();
    if (!content) return [];

    if (content.length <= TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS) {
        return [{ role, content, originalIndex: index, chunkIndex: 0 }];
    }

    if (role === 'system') {
        const chunks = chunkText(content, TOKEN_PLACE_API_V1_SYSTEM_CHUNK_CHARS);
        return chunks.map((chunk, chunkIndex) => ({
            role,
            content: `[DSPACE context chunk ${chunkIndex + 1}/${chunks.length}]\n${chunk}`,
            originalIndex: index,
            chunkIndex,
        }));
    }

    return chunkText(content, TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS).map(
        (chunk, chunkIndex) => ({ role, content: chunk, originalIndex: index, chunkIndex })
    );
};

const getTokenPlaceMessagePriority = (message, latestUserIndex, requiredSystemMessage) => {
    if (
        requiredSystemMessage &&
        message.originalIndex === requiredSystemMessage.originalIndex &&
        message.chunkIndex === requiredSystemMessage.chunkIndex
    ) {
        return 0;
    }
    if (message.originalIndex === latestUserIndex) return 1;
    if (message.role === 'system') return 2;
    if (message.role === 'user') return 3;
    return 4;
};

export const sanitizeTokenPlaceMessages = (messages = []) => {
    const sourceMessages = Array.isArray(messages) ? messages : [];
    const candidates = sourceMessages.flatMap(splitTokenPlaceMessage);
    const latestUserIndex = candidates.reduce(
        (latest, message) => (message.role === 'user' ? message.originalIndex : latest),
        -1
    );
    const requiredSystemMessage = candidates.find((message) => message.role === 'system');
    const selected = [];
    let totalChars = 0;

    for (const candidate of [...candidates].sort((a, b) => {
        const priorityDelta =
            getTokenPlaceMessagePriority(a, latestUserIndex, requiredSystemMessage) -
            getTokenPlaceMessagePriority(b, latestUserIndex, requiredSystemMessage);
        if (priorityDelta) return priorityDelta;
        if (a.role === 'system')
            return a.originalIndex - b.originalIndex || a.chunkIndex - b.chunkIndex;
        return b.originalIndex - a.originalIndex || a.chunkIndex - b.chunkIndex;
    })) {
        if (selected.length >= TOKEN_PLACE_API_V1_MAX_MESSAGES) break;
        if (totalChars + candidate.content.length > TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS) {
            continue;
        }
        selected.push(candidate);
        totalChars += candidate.content.length;
    }

    const shapedMessages = selected
        .sort((a, b) => a.originalIndex - b.originalIndex || a.chunkIndex - b.chunkIndex)
        .map(({ role, content }) => ({ role, content }));

    return shapedMessages.length ? shapedMessages : [{ ...TOKEN_PLACE_API_V1_FALLBACK_MESSAGE }];
};
