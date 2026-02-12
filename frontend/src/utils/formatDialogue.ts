export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const formatDialogue = (text: string = ''): string => {
    const inlineFormat = (segment: string): string => {
        const inlineSegments = segment.split('`');

        const joined = inlineSegments
            .map((inlineSegment, index) => {
                if (index % 2 === 1) {
                    const escapedCode = escapeHtml(inlineSegment.replace(/\s*\n\s*/g, ' ').trim());
                    return `<code>${escapedCode}</code>`;
                }

                return escapeHtml(inlineSegment).replace(/\n/g, '<br />');
            })
            .join('');

        return joined
            .replace(/<br \/>\s*<code>/g, ' <code>')
            .replace(/<\/code>\s*<br \/>/g, '</code> ');
    };

    const codeBlockSegments = String(text).split('```');

    return codeBlockSegments
        .map((segment, index) => {
            if (index % 2 === 1) {
                const escapedCodeBlock = escapeHtml(segment)
                    .replace(/^\n+|\n+$/g, '')
                    .replace(/\n/g, '<br />');
                return `<pre><code>${escapedCodeBlock}</code></pre>`;
            }

            return inlineFormat(segment);
        })
        .join('');
};
