export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const trimFencePadding = (value: string): string =>
    value.replace(/^\r?\n/, '').replace(/\r?\n$/, '');

const newlinePattern = /\r?\n/g;
const specialTokenPattern = /```|`/;
const closingFencePattern = /(^|\r?\n)```[ \t]*(?=\r?\n|$)/;
const wrappedInlineCodePattern = /\r?\n[ \t]*`([^`\r\n]+)`[ \t]*\r?\n/g;

const replaceNewlinesWithBreaks = (value: string): string =>
    value.replace(newlinePattern, '<br />');

const normalizeWrappedInlineCode = (value: string): string =>
    value.replace(wrappedInlineCodePattern, (_match, code: string) => ` \`${code}\` `);

const extractFenceLanguage = (value: string): { language: string | null; code: string } => {
    const firstNewlineIndex = value.indexOf('\n');
    const firstLine = firstNewlineIndex === -1 ? value : value.slice(0, firstNewlineIndex);
    const languageMatch = firstLine.match(/^[A-Za-z0-9_-]+$/);

    if (!languageMatch) {
        return { language: null, code: value };
    }

    const code = firstNewlineIndex === -1 ? '' : value.slice(firstNewlineIndex + 1);
    return { language: languageMatch[0], code };
};

const findClosingFenceIndex = (source: string, startIndex: number): number => {
    const match = closingFencePattern.exec(source.slice(startIndex));
    if (!match || match.index === undefined) {
        return -1;
    }

    return startIndex + match.index + match[1].length;
};

const normalizeInlineCode = (value: string): string => value.replace(newlinePattern, ' ').trim();

export const formatDialogue = (text: string = ''): string => {
    const source = normalizeWrappedInlineCode(String(text));
    const htmlSegments: string[] = [];
    let index = 0;

    while (index < source.length) {
        if (source.startsWith('```', index)) {
            const closingIndex = findClosingFenceIndex(source, index + 3);
            if (closingIndex === -1) {
                htmlSegments.push(replaceNewlinesWithBreaks(escapeHtml(source.slice(index))));
                break;
            }

            const fencedContent = trimFencePadding(source.slice(index + 3, closingIndex));
            const { language, code } = extractFenceLanguage(fencedContent);

            if (language) {
                htmlSegments.push(
                    `<pre><code class="language-${escapeHtml(language)}">${escapeHtml(code)}</code></pre>`
                );
            } else {
                htmlSegments.push(`<pre><code>${escapeHtml(fencedContent)}</code></pre>`);
            }
            index = closingIndex + 3;
            continue;
        }

        if (source[index] === '`') {
            const closingIndex = source.indexOf('`', index + 1);
            if (closingIndex === -1) {
                htmlSegments.push(replaceNewlinesWithBreaks(escapeHtml(source.slice(index))));
                break;
            }

            const inlineContent = normalizeInlineCode(source.slice(index + 1, closingIndex));
            htmlSegments.push(`<code>${escapeHtml(inlineContent)}</code>`);
            index = closingIndex + 1;
            continue;
        }

        const nextSpecial = source.slice(index).search(specialTokenPattern);
        const endIndex = nextSpecial === -1 ? source.length : index + nextSpecial;
        htmlSegments.push(replaceNewlinesWithBreaks(escapeHtml(source.slice(index, endIndex))));
        index = endIndex;
    }

    return htmlSegments.join('');
};
