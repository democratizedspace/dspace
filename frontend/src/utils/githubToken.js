import { loadGameState, saveGameState } from './gameState/common.js';

export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}

export function getStoredGitHubToken() {
    return (loadGameState().github && loadGameState().github.token) || '';
}

export function storeGitHubToken(token) {
    const state = loadGameState();
    state.github = state.github || {};
    state.github.token = token;
    saveGameState(state);
}

export function clearGitHubToken() {
    storeGitHubToken('');
}
