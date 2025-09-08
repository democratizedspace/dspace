export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}

import { loadGameState, saveGameState, ready } from './gameState/common.js';

export async function loadGitHubToken() {
    await ready;
    const state = loadGameState();
    if (state.github?.token) return state.github.token;
    try {
        const raw = localStorage.getItem('gameState');
        return raw ? JSON.parse(raw).github?.token || '' : '';
    } catch {
        return '';
    }
}

export async function saveGitHubToken(token) {
    await ready;
    const state = loadGameState();
    state.github = state.github || {};
    state.github.token = token;
    await saveGameState(state);
}

export async function clearGitHubToken() {
    await ready;
    const state = loadGameState();
    if (state.github) {
        state.github.token = '';
    }
    await saveGameState(state);
}
