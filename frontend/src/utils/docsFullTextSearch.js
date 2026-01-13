const WORD_REGEX = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

const normalizeValue = (value = '') => value.toLowerCase().trim();

export const parseDocsQuery = (raw = '') => {
    const normalized = normalizeValue(raw);
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const operators = [];
    const keywords = [];

    tokens.forEach((token) => {
        if (token.startsWith('has:')) {
            const feature = normalizeValue(token.slice(4));

            if (feature) {
                operators.push(feature);
            }

            return;
        }

        keywords.push(token);
    });

    const uniqueKeywords = Array.from(new Set(keywords)).sort();

    return {
        normalized,
        operators,
        keywords: uniqueKeywords,
        isHasPredicate: operators.length > 0,
    };
};

export const markdownToPlainText = (content = '') => {
    if (typeof content !== 'string' || !content.trim()) {
        return '';
    }

    return content
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/!\[([^\]]*)]\([^\s)]+\)/g, '$1')
        .replace(/\[([^\]]+)]\([^\s)]+\)/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*>+\s?/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/[*_~]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export const extractSnippet = (bodyText = '', keyword = '') => {
    if (!bodyText || !keyword) {
        return null;
    }

    const words = bodyText.match(WORD_REGEX) ?? [];
    const normalizedKeyword = normalizeValue(keyword);

    for (let index = 0; index < words.length; index += 1) {
        const word = words[index];

        if (normalizeValue(word).includes(normalizedKeyword)) {
            const start = Math.max(0, index - 2);
            const end = Math.min(words.length, index + 3);

            return {
                before: words.slice(start, index),
                match: word,
                after: words.slice(index + 1, end),
            };
        }
    }

    return null;
};

export const findDocSnippet = (doc, keywords = []) => {
    if (!doc?.bodyText) {
        return null;
    }

    const orderedKeywords = Array.from(new Set(keywords)).sort();

    for (const keyword of orderedKeywords) {
        const snippet = extractSnippet(doc.bodyText, keyword);

        if (snippet) {
            return { keyword, snippet };
        }
    }

    return null;
};
