import { isBrowser } from './ssr.js';

/**
 * Copy text to the clipboard with a cross-browser fallback.
 * @param {string} text - The string to copy.
 * @returns {Promise<void>} Resolves when the text is copied.
 */
export async function copyToClipboard(text) {
    // Only execute in browser environment
    if (!isBrowser) {
        throw new Error('Clipboard is not available in this environment.');
    }

    let writeError;
    if (navigator?.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (error) {
            writeError = error;
        }
    }

    const selection = document.getSelection();
    const originalRange = selection?.rangeCount ? selection.getRangeAt(0) : null;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const copied = document.execCommand('copy');
        if (!copied) {
            throw new Error('Copy command was rejected.');
        }
    } catch (error) {
        throw writeError instanceof Error
            ? writeError
            : error instanceof Error
              ? error
              : new Error('Failed to copy to clipboard');
    } finally {
        document.body.removeChild(textarea);
        if (originalRange && selection) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }
    }
}
