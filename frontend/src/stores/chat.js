import { writable } from 'svelte/store';

// Store for chat messages used across dChat components
export const messages = writable([]);

// Utility to count simple whitespace-separated tokens
export function countTokens(content) {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
}
