import { importGameStateString, loadGameState, saveGameState, ready } from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';
import { createBackupGist, sanitizeSaveForBackup } from '../lib/cloudsync/githubGists.js';

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

const toExportString = (state) => JSON.stringify(state);

async function uploadGameStateToGist(token, fetcher = fetch) {
    const resolvedToken = token || (await loadGitHubToken());
    if (!resolvedToken) {
        throw new Error('GitHub token required');
    }

    const state = loadGameState();
    const sanitizedState = sanitizeSaveForBackup(state);
    const content = toExportString(sanitizedState);
    const gist = await createBackupGist({ token: resolvedToken, content, fetcher });
    await clearCloudGistId();
    return gist.id;
}

async function downloadGameStateFromGist(token, gistId, fetcher = fetch) {
    if (!gistId) {
        gistId = await loadCloudGistId();
    }
    if (!gistId) throw new Error('No gist id specified');
    if (!token) {
        token = await loadGitHubToken();
    }
    const headers = token ? { Authorization: `token ${token}` } : {};
    const res = await fetcher(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) throw new Error('Failed to download game state');
    const data = await res.json();
    const content =
        Object.values(data?.files || {}).find((file) => file && typeof file.content === 'string')
            ?.content || '';
    if (!content) throw new Error('Invalid gist content');
    await importGameStateString(content);
    await saveCloudGistId(gistId);
}

export { loadCloudGistId, uploadGameStateToGist, downloadGameStateFromGist, clearCloudGistId };
