import { exportGameStateString, importGameStateString } from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';

const storageKey = 'gameState';

function loadCloudGistId() {
    try {
        const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
        return state.cloudSync?.gistId || '';
    } catch {
        return '';
    }
}

function saveCloudGistId(id) {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
    state.cloudSync = state.cloudSync || {};
    state.cloudSync.gistId = id;
    localStorage.setItem(storageKey, JSON.stringify(state));
}

function clearCloudGistId() {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (state.cloudSync) {
        state.cloudSync.gistId = '';
    }
    localStorage.setItem(storageKey, JSON.stringify(state));
}

async function uploadGameStateToGist(token) {
    if (!token) {
        token = loadGitHubToken();
    }
    const gistId = loadCloudGistId();
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

async function downloadGameStateFromGist(token, gistId = loadCloudGistId()) {
    if (!gistId) throw new Error('No gist id specified');
    if (!token) {
        token = loadGitHubToken();
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
