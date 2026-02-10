export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const formatDialogue = (text: string = ''): string => {
    const segments = String(text).split('`');

    return segments
        .map((segment, index) => {
            const escaped = escapeHtml(segment).replace(/\n/g, '<br />');
            return index % 2 === 1 ? `<code>${escaped}</code>` : escaped;
        })
        .join('');
};
