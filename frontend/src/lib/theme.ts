import { isBrowser } from '../utils/ssr.js';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'dspace-theme';
export const DEFAULT_THEME: Theme = 'dark';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

export const readStoredTheme = (): Theme | null => {
    if (!isBrowser) return null;
    try {
        const value = localStorage.getItem(THEME_STORAGE_KEY);
        return isTheme(value) ? value : null;
    } catch (error) {
        console.warn('Unable to read theme preference:', error);
        return null;
    }
};

export const detectSystemTheme = (): Theme => {
    if (!isBrowser) return DEFAULT_THEME;

    try {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    } catch (error) {
        console.warn('Unable to detect system theme preference:', error);
        return DEFAULT_THEME;
    }
};

export const persistTheme = (theme: Theme): void => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn('Unable to persist theme preference:', error);
    }
};

export const applyTheme = (theme: Theme): void => {
    if (!isBrowser) return;

    document.documentElement.dataset.theme = theme;
    if (document.body) {
        document.body.dataset.theme = theme;
    }
};

export const initializeTheme = (): Theme => {
    const storedTheme = readStoredTheme();
    const theme = storedTheme ?? detectSystemTheme();

    applyTheme(theme);
    persistTheme(theme);

    return theme;
};

export const setTheme = (theme: Theme): Theme => {
    applyTheme(theme);
    persistTheme(theme);
    return theme;
};
