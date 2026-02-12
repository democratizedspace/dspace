export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const formatInlineCode = (text: string): string => {
    const segments = text.split('`');

    return segments
        .map((segment, index) => {
            if (index % 2 === 1) {
                return `<code>${escapeHtml(segment).replace(/\n/g, ' ')}</code>`;
            }

            return escapeHtml(segment).replace(/\n/g, '<br />');
        })
        .join('');
};

export const formatDialogue = (text: string = ''): string => {
    const source = String(text);
    const fencedCodeBlockPattern = /```([\w-]+)?\n?([\s\S]*?)```/g;
    let cursor = 0;
    let html = '';
    let match: RegExpExecArray | null;

    while ((match = fencedCodeBlockPattern.exec(source)) !== null) {
        const [fullMatch, language = '', code = ''] = match;
        const beforeBlock = source.slice(cursor, match.index);
        html += formatInlineCode(beforeBlock);

        const trimmedLanguage = language.trim();
        const languageClass = trimmedLanguage
            ? ` class="language-${escapeHtml(trimmedLanguage)}"`
            : '';
        html += `<pre><code${languageClass}>${escapeHtml(code)}</code></pre>`;

        cursor = match.index + fullMatch.length;
    }

    html += formatInlineCode(source.slice(cursor));

    return html;
};
