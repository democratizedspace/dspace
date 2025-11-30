import { isBrowser } from './ssr.js';

/**
 * Copy text to the clipboard with a cross-browser fallback.
 * @param {string} text - The string to copy.
 * @returns {Promise<void>} Resolves when the text is copied.
 */
export async function copyToClipboard(text) {
    // Only execute in browser environment
    if (!isBrowser) return;

    if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
