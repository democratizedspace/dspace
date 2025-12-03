import { isBrowser } from '../utils/ssr.js';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'dspace-theme';
export const DEFAULT_THEME: Theme = 'dark';

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

export function readStoredTheme(): Theme | null {
    if (!isBrowser) return null;
    try {
        const value = localStorage.getItem(THEME_STORAGE_KEY);
        return isTheme(value) ? value : null;
    } catch (error) {
        console.warn('Unable to read theme preference:', error);
        return null;
    }
}

export function detectPreferredTheme(): Theme {
    if (!isBrowser) return DEFAULT_THEME;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    return prefersDark ? 'dark' : 'light';
}

export function persistTheme(theme: Theme): void {
    if (!isBrowser) return;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn('Unable to persist theme preference:', error);
    }
}

export function applyTheme(theme: Theme): void {
    if (!isBrowser) return;
    document.documentElement.dataset.theme = theme;
    if (typeof document.body !== 'undefined') {
        document.body.setAttribute('data-theme', theme);
    }
}

export function resolveTheme(): Theme {
    const stored = readStoredTheme();
    if (stored) return stored;

    const preferred = detectPreferredTheme();
    persistTheme(preferred);
    return preferred;
}

export function setTheme(theme: Theme): Theme {
    applyTheme(theme);
    persistTheme(theme);
    return theme;
}

export function initializeTheme(): Theme {
    const theme = resolveTheme();
    applyTheme(theme);
    return theme;
}
