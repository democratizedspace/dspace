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

const normalizeValue = (value = '') => value.toLowerCase().trim();

const normalizeWord = (value = '') =>
    normalizeValue(value).replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

export const parseDocsQuery = (raw = ''): ParsedDocsQuery => {
    const normalizedInput = normalizeValue(raw);
    const words = normalizedInput.split(/\s+/).filter(Boolean);
    const operators: string[] = [];
    const keywords: string[] = [];

    words.forEach((word) => {
        if (word.startsWith('has:')) {
            const feature = normalizeValue(word.slice(4));

            if (feature) {
                operators.push(feature);
            }

            return;
        }

        keywords.push(word);
    });

    const dedupedKeywords = Array.from(new Set(keywords)).sort();
    const normalized = words.join(' ');

    return {
        normalized,
        operators,
        keywords: dedupedKeywords,
        isHasPredicate: operators.length > 0,
    };
};

export const extractSnippet = (bodyText = '', keyword = ''): SnippetParts | null => {
    const normalizedKeyword = normalizeValue(keyword);

    if (!normalizedKeyword || !bodyText.trim()) {
        return null;
    }

    const words = bodyText.split(/\s+/).filter(Boolean);

    for (let index = 0; index < words.length; index += 1) {
        const word = words[index];
        const normalizedWord = normalizeWord(word);

        if (!normalizedWord.includes(normalizedKeyword)) {
            continue;
        }

        const before = words.slice(Math.max(0, index - 2), index);
        const after = words.slice(index + 1, index + 3);

        return { before, match: word, after };
    }

    return null;
};

export const findDocSnippet = (
    doc: { title: string; bodyText: string },
    keywords: string[] = []
): { keyword: string; snippet: SnippetParts } | null => {
    const normalizedKeywords = Array.from(new Set(keywords.map(normalizeValue))).sort();

    for (const keyword of normalizedKeywords) {
        const snippet = extractSnippet(doc.bodyText, keyword);

        if (snippet) {
            return { keyword, snippet };
        }
    }

    return null;
};

export const markdownToPlainText = (markdown = ''): string => {
    if (typeof markdown !== 'string') {
        return '';
    }

    let text = markdown;

    text = text.replace(/^---[\s\S]*?---/g, ' ');
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/~~~[\s\S]*?~~~/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/!\[([^\]]*)]\([^)]*\)/g, '$1');
    text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/[#>*_~]/g, ' ');
    text = text.replace(/\s+/g, ' ');

    return text.trim();
};

export const normalizeSearchValue = normalizeValue;
