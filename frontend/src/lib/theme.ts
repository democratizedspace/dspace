import { isBrowser } from '../utils/ssr.js';

export const THEME_STORAGE_KEY = 'dspace-theme';
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const DEFAULT_THEME: Theme = 'dark';

const isValidTheme = (value: unknown): value is Theme =>
    typeof value === 'string' && THEMES.includes(value as Theme);

export const coerceTheme = (value: unknown): Theme | null => (isValidTheme(value) ? value : null);

export const getPreferredTheme = (): Theme => {
    if (!isBrowser) return DEFAULT_THEME;

    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : DEFAULT_THEME;
};

export const readStoredTheme = (): Theme | null => {
    if (!isBrowser) return null;

    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return coerceTheme(stored);
    } catch (error) {
        console.warn('Unable to read theme preference:', error);
        return null;
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
    document.body?.setAttribute('data-theme', theme);
};

export const initializeTheme = (): Theme => {
    const stored = readStoredTheme();
    const theme = stored ?? getPreferredTheme();

    if (!stored) {
        persistTheme(theme);
    }

    applyTheme(theme);
    return theme;
};

export const flipTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark');
