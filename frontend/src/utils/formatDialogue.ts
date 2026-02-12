export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const normalizeInlineCode = (value: string): string => value.replace(/\s+/g, ' ').trim();

const trimFencePadding = (value: string): string =>
    value.replace(/^\r?\n/, '').replace(/\r?\n$/, '');

export const formatDialogue = (text: string = ''): string => {
    const source = String(text);
    const htmlSegments: string[] = [];
    let index = 0;

    while (index < source.length) {
        if (source.startsWith('```', index)) {
            const closingIndex = source.indexOf('```', index + 3);
            if (closingIndex === -1) {
                htmlSegments.push(escapeHtml(source.slice(index)).replace(/\n/g, '<br />'));
                break;
            }

            const fencedContent = trimFencePadding(source.slice(index + 3, closingIndex));
            htmlSegments.push(`<pre><code>${escapeHtml(fencedContent)}</code></pre>`);
            index = closingIndex + 3;
            continue;
        }

        if (source[index] === '`') {
            const closingIndex = source.indexOf('`', index + 1);
            if (closingIndex === -1) {
                htmlSegments.push(escapeHtml(source.slice(index)).replace(/\n/g, '<br />'));
                break;
            }

            const inlineContent = normalizeInlineCode(source.slice(index + 1, closingIndex));
            htmlSegments.push(`<code>${escapeHtml(inlineContent)}</code>`);
            index = closingIndex + 1;
            continue;
        }

        const nextSpecial = source.slice(index).search(/```|`/);
        const endIndex = nextSpecial === -1 ? source.length : index + nextSpecial;
        htmlSegments.push(escapeHtml(source.slice(index, endIndex)).replace(/\n/g, '<br />'));
        index = endIndex;
    }

    return htmlSegments.join('');
};
