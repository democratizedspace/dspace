export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}

const storageKey = 'gameState';

export function loadGitHubToken() {
    try {
        const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
        return state.github?.token || '';
    } catch {
        return '';
    }
}

export function saveGitHubToken(token) {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
    state.github = state.github || {};
    state.github.token = token;
    localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearGitHubToken() {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (state.github) {
        state.github.token = '';
    }
    localStorage.setItem(storageKey, JSON.stringify(state));
}
