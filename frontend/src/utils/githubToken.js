import { looksLikeGitHubToken } from '../lib/cloudsync/githubGists';

export function isValidGitHubToken(token) {
    return looksLikeGitHubToken(token);
}

import { isGameStateReady, loadGameState, saveGameState, ready } from './gameState/common.js';

export async function loadGitHubToken() {
    if (!isGameStateReady()) {
        await ready;
    }
    const state = loadGameState();
    return state.github?.token || '';
}

export async function saveGitHubToken(token) {
    if (!isGameStateReady()) {
        await ready;
    }
    const state = loadGameState();
    state.github = state.github || {};
    state.github.token = token;
    await saveGameState(state);
}

export async function clearGitHubToken() {
    if (!isGameStateReady()) {
        await ready;
    }
    const state = loadGameState();
    if (state.github) {
        state.github.token = '';
    }
    await saveGameState(state);
}
