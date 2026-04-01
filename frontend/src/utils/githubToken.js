export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    if (!trimmed) return false;
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}

import { isBrowser } from './ssr.js';
import { isGameStateReady, loadGameState, saveGameState, ready } from './gameState/common.js';

const GAME_STATE_DB_NAME = 'dspaceGameState';
const GAME_STATE_STORE = 'state';
const GAME_STATE_ROOT_KEY = 'root';

const persistGameStateToIndexedDb = async (state) => {
    if (!isBrowser || !('indexedDB' in globalThis)) {
        return;
    }

    await new Promise((resolve) => {
        const request = indexedDB.open(GAME_STATE_DB_NAME);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(GAME_STATE_STORE)) {
                db.createObjectStore(GAME_STATE_STORE);
            }
        };
        request.onerror = () => resolve();
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(GAME_STATE_STORE, 'readwrite');
            tx.objectStore(GAME_STATE_STORE).put(state, GAME_STATE_ROOT_KEY);
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                resolve();
            };
        };
    });
};

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
    await persistGameStateToIndexedDb(loadGameState());
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
    await persistGameStateToIndexedDb(loadGameState());
}
