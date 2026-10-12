export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    if (!trimmed) return false;
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}

import {
    loadGameState,
    ready,
    saveCredential,
    clearCredential,
    assertCredentialLaunch,
} from './gameState/common.js';
export async function loadGitHubToken() {
    await ready;
    const token = loadGameState().github?.token || '';
    if (token) await assertCredentialLaunch('github', token);
    return token;
}
export async function saveGitHubToken(token) {
    return saveCredential('github', typeof token === 'string' ? token.trim() : token);
}
export async function clearGitHubToken() {
    const result = await clearCredential('github');
    if (result.status !== 'complete') throw new Error(`Credential clear ${result.status}`);
    return result;
}
