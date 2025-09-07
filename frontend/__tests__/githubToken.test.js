/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    loadGitHubToken,
    saveGitHubToken,
    clearGitHubToken,
    isValidGitHubToken,
} from '../src/utils/githubToken.js';
import { loadGameState, resetGameState, ready } from '../src/utils/gameState/common.js';

describe('githubToken utils', () => {
    beforeEach(async () => {
        await ready;
        resetGameState();
    });

    test('saves and loads token', async () => {
        saveGitHubToken('abc');
        expect(await loadGitHubToken()).toBe('abc');
        expect(loadGameState().github.token).toBe('abc');
    });

    test('clears token', async () => {
        saveGitHubToken('xyz');
        clearGitHubToken();
        expect(await loadGitHubToken()).toBe('');
        expect(loadGameState().github.token).toBe('');
    });

    test('validates tokens correctly', () => {
        expect(isValidGitHubToken('ghp_123456789012345678901234567890123456')).toBe(true);
        expect(isValidGitHubToken('github_pat_abcdefghijklmnopqrstuvwxyz12')).toBe(true);
        expect(isValidGitHubToken('')).toBe(false);
        expect(isValidGitHubToken('short')).toBe(false);
        expect(isValidGitHubToken('ghp_invalid')).toBe(false);
    });
});
