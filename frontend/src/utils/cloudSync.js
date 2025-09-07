import {
    exportGameStateString,
    importGameStateString,
    loadGameState,
    saveGameState,
    ready,
} from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';

async function loadCloudGistId() {
    await ready;
    const state = loadGameState();
    return state.cloudSync?.gistId || '';
}

function saveCloudGistId(id) {
    const state = loadGameState();
    state.cloudSync = state.cloudSync || {};
    state.cloudSync.gistId = id;
    saveGameState(state);
}

function clearCloudGistId() {
    const state = loadGameState();
    if (state.cloudSync) {
        state.cloudSync.gistId = '';
    }
    saveGameState(state);
}

async function uploadGameStateToGist(token) {
    if (!token) {
        token = await loadGitHubToken();
    }
    const gistId = await loadCloudGistId();
    const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
    };
    const content = exportGameStateString();
    let res;
    if (gistId) {
        res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ files: { 'dspace-save.json': { content } } }),
        });
    } else {
        res = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                description: 'DSPACE cloud save',
                public: false,
                files: { 'dspace-save.json': { content } },
            }),
        });
    }
    if (!res.ok) throw new Error('Failed to upload game state');
    const data = await res.json();
    saveCloudGistId(data.id);
    return data.id;
}

async function downloadGameStateFromGist(token, gistId) {
    if (!gistId) {
        gistId = await loadCloudGistId();
    }
    if (!gistId) throw new Error('No gist id specified');
    if (!token) {
        token = await loadGitHubToken();
    }
    const headers = token ? { Authorization: `token ${token}` } : {};
    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) throw new Error('Failed to download game state');
    const data = await res.json();
    const content = data.files['dspace-save.json']?.content;
    if (!content) throw new Error('Invalid gist content');
    importGameStateString(content);
    saveCloudGistId(gistId);
}

export { loadCloudGistId, uploadGameStateToGist, downloadGameStateFromGist, clearCloudGistId };
