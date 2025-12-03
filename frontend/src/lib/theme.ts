export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'dspace-theme';
export const DEFAULT_THEME: Theme = 'dark';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function isValidTheme(value: unknown): value is Theme {
    return value === 'light' || value === 'dark';
}

export function detectPreferredTheme(): Theme {
    if (isBrowser && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    return DEFAULT_THEME;
}

export function readStoredTheme(): Theme | null {
    if (!isBrowser) {
        return null;
    }

    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return isValidTheme(storedTheme) ? storedTheme : null;
    } catch (error) {
        console.warn('Unable to read theme preference:', error);
        return null;
    }
}

export function persistTheme(theme: Theme): void {
    if (!isBrowser) {
        return;
    }

    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn('Unable to persist theme preference:', error);
    }
}

export function applyTheme(theme: Theme): void {
    if (!isBrowser) {
        return;
    }

    document.documentElement.dataset.theme = theme;
    if (document.body) {
        document.body.dataset.theme = theme;
    }
}

export function resolveInitialTheme(): Theme {
    const stored = readStoredTheme();
    const resolved = stored ?? detectPreferredTheme();

    if (!stored) {
        persistTheme(resolved);
    }

    applyTheme(resolved);
    return resolved;
}

export function setTheme(theme: Theme): Theme {
    const nextTheme = isValidTheme(theme) ? theme : DEFAULT_THEME;
    applyTheme(nextTheme);
    persistTheme(nextTheme);
    return nextTheme;
}
