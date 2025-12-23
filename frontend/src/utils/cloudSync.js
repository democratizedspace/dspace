import { importGameStateString, loadGameState, saveGameState, ready } from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';
import { createBackupGist, listBackups, sanitizeSaveForBackup } from '../lib/cloudsync/githubGists';

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

const encodeForBackup = (state) => {
    const jsonStr = JSON.stringify(state);
    if (typeof btoa === 'function') {
        return btoa(jsonStr);
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(jsonStr, 'utf8').toString('base64');
    }
    throw new Error('Base64 encoding is not supported in this environment');
};

async function uploadGameStateToGist(token, fetchImpl = fetch) {
    const activeToken = token || (await loadGitHubToken());
    if (!activeToken) {
        throw new Error('GitHub token required');
    }

    await ready;
    const state = loadGameState();
    const sanitized = sanitizeSaveForBackup(state);
    const content = encodeForBackup(sanitized);
    const gist = await createBackupGist(activeToken, content, fetchImpl);
    await clearCloudGistId();
    return gist;
}

async function downloadGameStateFromGist(token, gistId, fetchImpl = fetch) {
    const resolvedGistId = gistId || (await loadCloudGistId());
    if (!resolvedGistId) throw new Error('No gist id specified');
    const activeToken = token || (await loadGitHubToken());
    const headers = activeToken ? { Authorization: `token ${activeToken}` } : {};
    const res = await fetchImpl(`https://api.github.com/gists/${resolvedGistId}`, { headers });
    if (!res.ok) throw new Error('Failed to download game state');
    const data = await res.json();
    const content = Object.values(data.files || {})[0]?.content;
    if (!content) throw new Error('Invalid gist content');
    await importGameStateString(content);
    await saveCloudGistId('');
}

async function listCloudBackups(token, fetchImpl = fetch) {
    const activeToken = token || (await loadGitHubToken());
    if (!activeToken) {
        throw new Error('GitHub token required');
    }
    return listBackups(activeToken, fetchImpl);
}

export {
    loadCloudGistId,
    uploadGameStateToGist,
    downloadGameStateFromGist,
    clearCloudGistId,
    listCloudBackups,
};
