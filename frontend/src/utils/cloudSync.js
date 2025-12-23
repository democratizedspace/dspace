import { importGameStateString, loadGameState, saveGameState, ready } from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';
import {
    createBackupGist,
    findBackupFile,
    sanitizeSaveForBackup,
} from '../lib/cloudsync/githubGists';

async function loadCloudGistId() {
    await ready;
    const state = loadGameState();
    return state.cloudSync?.gistId || '';
}

async function saveCloudGistId(id) {
    await ready;
    const state = loadGameState();
    state.cloudSync = state.cloudSync || {};
    state.cloudSync.gistId = id;
    await saveGameState(state);
}

async function clearCloudGistId() {
    await ready;
    const state = loadGameState();
    if (state.cloudSync) {
        state.cloudSync.gistId = '';
    }
    await saveGameState(state);
}

async function uploadGameStateToGist(token, fetchImpl = fetch, date = new Date()) {
    if (!token) {
        token = await loadGitHubToken();
    }

    if (!token) {
        throw new Error('GitHub token required');
    }

    await ready;

    const gist = await createBackupGist({
        token,
        state: sanitizeSaveForBackup(loadGameState()),
        fetchImpl,
        date,
    });

    await clearCloudGistId();
    return gist;
}

async function downloadGameStateFromGist(token, gistId, fetchImpl = fetch) {
    if (!gistId) {
        gistId = await loadCloudGistId();
    }
    if (!gistId) throw new Error('No gist id specified');
    if (!token) {
        token = await loadGitHubToken();
    }
    const headers = token ? { Authorization: `token ${token}` } : {};
    const res = await fetchImpl(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) throw new Error('Failed to download game state');
    const data = await res.json();
    const content = findBackupFile(data.files)?.content;
    if (!content) throw new Error('Invalid gist content');
    await importGameStateString(content);
    await saveCloudGistId(gistId);
}

export { loadCloudGistId, uploadGameStateToGist, downloadGameStateFromGist, clearCloudGistId };
