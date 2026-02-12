export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const normalizeInlineCodeLineBreaks = (text: string): string =>
    text.replace(/\n+\s*`([^`\n]+)`\s*\n+/g, ' `$1` ');

const formatInlineSection = (text: string): string => {
    const segments = text.split('`');

    return segments
        .map((segment, index) => {
            const escaped = escapeHtml(segment);
            return index % 2 === 1 ? `<code>${escaped}</code>` : escaped.replace(/\n/g, '<br />');
        })
        .join('');
};

export const formatDialogue = (text: string = ''): string => {
    const normalized = normalizeInlineCodeLineBreaks(String(text));
    const fencePattern = /```([\s\S]*?)```/g;
    let formatted = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = fencePattern.exec(normalized))) {
        formatted += formatInlineSection(normalized.slice(lastIndex, match.index));
        formatted += `<pre><code>${escapeHtml(match[1])}</code></pre>`;
        lastIndex = match.index + match[0].length;
    }

    formatted += formatInlineSection(normalized.slice(lastIndex));
    return formatted;
};
