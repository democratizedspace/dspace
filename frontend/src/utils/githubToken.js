export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}

import { loadGameState, saveGameState } from './gameState/common.js';

export function loadGitHubToken() {
    const state = loadGameState();
    return state.github?.token || '';
}

export function saveGitHubToken(token) {
    const state = loadGameState();
    state.github = state.github || {};
    state.github.token = token;
    saveGameState(state);
}

export function clearGitHubToken() {
    const state = loadGameState();
    if (state.github) {
        state.github.token = '';
    }
    saveGameState(state);
}
