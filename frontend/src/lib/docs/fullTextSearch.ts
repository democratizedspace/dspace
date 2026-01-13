const WORD_REGEX = /[\p{L}\p{N}']+/gu;

const normalize = (value: string) => value.toLowerCase().trim();

const uniqueSorted = (values: string[]) => {
    const filtered = values.map(normalize).filter(Boolean);
    return Array.from(new Set(filtered)).sort();
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export type ParsedDocsQuery = {
    normalized: string;
    operators: string[];
    keywords: string[];
    isHasPredicate: boolean;
};

export type SnippetParts = {
    before: string[];
    match: string;
    after: string[];
};

export const parseDocsQuery = (raw: string): ParsedDocsQuery => {
    const normalized = normalize(raw);

    if (!normalized) {
        return { normalized: '', operators: [], keywords: [], isHasPredicate: false };
    }

    const words = normalized.split(/\s+/).filter(Boolean);
    const operators: string[] = [];
    const keywords: string[] = [];

    words.forEach((word) => {
        if (word.startsWith('has:')) {
            const operator = normalize(word.slice(4));

            if (operator) {
                operators.push(operator);
            }

            return;
        }

        keywords.push(word);
    });

    const sortedKeywords = uniqueSorted(keywords);

    return {
        normalized,
        operators: uniqueSorted(operators),
        keywords: sortedKeywords,
        isHasPredicate: operators.length > 0,
    };
};

export const extractSnippet = (bodyText: string, keyword: string): SnippetParts | null => {
    if (!bodyText || !keyword) {
        return null;
    }

    const loweredKeyword = normalize(keyword);
    const words = Array.from(bodyText.matchAll(WORD_REGEX), (match) => match[0]);

    if (!words.length) {
        return null;
    }

    const matchIndex = words.findIndex((word) => normalize(word).includes(loweredKeyword));

    if (matchIndex === -1) {
        return null;
    }

    const start = Math.max(0, matchIndex - 2);
    const end = Math.min(words.length, matchIndex + 3);

    return {
        before: words.slice(start, matchIndex),
        match: words[matchIndex],
        after: words.slice(matchIndex + 1, end),
    };
};

const buildSnippetHtml = (snippet: SnippetParts) => {
    const parts: string[] = [];

    if (snippet.before.length) {
        parts.push(escapeHtml(snippet.before.join(' ')));
    }

    parts.push(`<strong>${escapeHtml(snippet.match)}</strong>`);

    if (snippet.after.length) {
        parts.push(escapeHtml(snippet.after.join(' ')));
    }

    return parts.join(' ');
};

export const findDocSnippet = (
    doc: { title: string; bodyText?: string },
    keywords: string[]
): { keyword: string; snippetHtml: string } | null => {
    if (!doc.bodyText || !keywords.length) {
        return null;
    }

    const sortedKeywords = uniqueSorted(keywords);

    for (const keyword of sortedKeywords) {
        const snippet = extractSnippet(doc.bodyText, keyword);

        if (snippet) {
            return { keyword, snippetHtml: buildSnippetHtml(snippet) };
        }
    }

    return null;
};

export const stripMarkdownToText = (markdown: string) => {
    if (!markdown) {
        return '';
    }

    let text = markdown;

    text = text.replace(/^---[\s\S]*?---/g, ' ');
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/!\[([^\]]*)]\([^)]*\)/g, '$1');
    text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/^\s*#+\s*/gm, '');
    text = text.replace(/^\s*>\s*/gm, '');
    text = text.replace(/[*_~]+/g, '');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
};
