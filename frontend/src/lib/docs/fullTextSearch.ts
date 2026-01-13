const normalizeText = (value: string) => value.toLowerCase().trim();

export const parseDocsQuery = (raw = '') => {
    const normalized = normalizeText(raw);

    if (!normalized) {
        return { normalized: '', keywords: [], operators: [], isHasPredicate: false };
    }

    const words = normalized.split(/\s+/).filter(Boolean);
    const operators: string[] = [];
    const terms: string[] = [];

    words.forEach((word) => {
        if (word.startsWith('has:')) {
            const feature = normalizeText(word.slice(4));

            if (feature) {
                operators.push(feature);
            }

            return;
        }

        terms.push(word);
    });

    const keywords = Array.from(new Set(terms)).sort();

    return {
        normalized,
        keywords,
        operators,
        isHasPredicate: operators.length > 0,
    };
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const highlightMatch = (word: string, keyword: string) => {
    const lowerWord = word.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const matchIndex = lowerWord.indexOf(lowerKeyword);

    if (matchIndex === -1) {
        return escapeHtml(word);
    }

    const before = escapeHtml(word.slice(0, matchIndex));
    const match = escapeHtml(word.slice(matchIndex, matchIndex + lowerKeyword.length));
    const after = escapeHtml(word.slice(matchIndex + lowerKeyword.length));

    return `${before}<strong>${match}</strong>${after}`;
};

export const extractSnippet = (bodyText: string, keyword: string) => {
    if (!bodyText || !keyword) {
        return null;
    }

    const words = bodyText.split(/\s+/).filter(Boolean);
    const lowerKeyword = keyword.toLowerCase();
    const matchIndex = words.findIndex((word) => word.toLowerCase().includes(lowerKeyword));

    if (matchIndex === -1) {
        return null;
    }

    const before = words.slice(Math.max(0, matchIndex - 2), matchIndex);
    const match = words[matchIndex];
    const after = words.slice(matchIndex + 1, matchIndex + 3);

    return { before, match, after };
};

export const findDocSnippet = (doc: { title: string; bodyText: string }, keywords: string[]) => {
    const sortedKeywords = Array.from(
        new Set(keywords.map((keyword) => keyword.toLowerCase()))
    ).sort();

    for (const keyword of sortedKeywords) {
        const snippet = extractSnippet(doc.bodyText, keyword);

        if (!snippet) {
            continue;
        }

        const words = [
            ...snippet.before.map(escapeHtml),
            highlightMatch(snippet.match, keyword),
            ...snippet.after.map(escapeHtml),
        ];

        return {
            keyword,
            snippetHtml: words.join(' '),
        };
    }

    return null;
};

export const stripMarkdownToText = (markdown = '') => {
    if (!markdown) {
        return '';
    }

    let text = markdown;

    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
    text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
    text = text.replace(/^#{1,6}\s*/gm, '');
    text = text.replace(/[*_~]+/g, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
};
