import { importGameStateString, loadGameState, saveGameState, ready } from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';
import {
    BACKUP_DESCRIPTION,
    BACKUP_FILE_PREFIX,
    createBackupGist,
    listBackups,
    sanitizeSaveForBackup,
} from '../lib/cloudsync/githubGists';

const encodeGameState = (state) => {
    const jsonStr = JSON.stringify(state);
    if (typeof btoa === 'function') {
        return btoa(jsonStr);
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(jsonStr, 'utf8').toString('base64');
    }
    throw new Error('Base64 encoding is not supported in this environment');
};

async function loadCloudGistId() {
    await ready;
    const state = loadGameState();
    return state.cloudSync?.gistId || '';
}

async function clearCloudGistId() {
    await ready;
    const state = loadGameState();
    if (state.cloudSync) {
        state.cloudSync.gistId = '';
    }
    await saveGameState(state);
}

async function uploadGameStateToGist(token) {
    if (!token) {
        token = await loadGitHubToken();
    }
    await ready;
    const state = loadGameState();
    const safeState = sanitizeSaveForBackup(state);
    const content = encodeGameState(safeState);
    const result = await createBackupGist({
        token,
        content,
        description: BACKUP_DESCRIPTION,
    });
    await clearCloudGistId();
    return result;
}

async function downloadGameStateFromGist(token, gistId) {
    if (!gistId) {
        gistId = await loadCloudGistId();
    }
    if (!gistId) throw new Error('No gist id specified');
    if (!token) {
        token = await loadGitHubToken();
    }
    const trimmedToken = token?.trim?.();
    const headers = trimmedToken ? { Authorization: `token ${trimmedToken}` } : {};
    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) throw new Error('Failed to download game state');
    const data = await res.json();
    const files = data.files || {};
    const backupFile =
        Object.values(files).find((file) => file?.filename?.startsWith(BACKUP_FILE_PREFIX)) ||
        files['dspace-save.json'];
    const content = backupFile?.content;
    if (!content) throw new Error('Invalid gist content');
    await importGameStateString(content);
}

async function fetchBackupList(token) {
    return listBackups(token);
}

export {
    loadCloudGistId,
    uploadGameStateToGist,
    downloadGameStateFromGist,
    clearCloudGistId,
    fetchBackupList,
};
