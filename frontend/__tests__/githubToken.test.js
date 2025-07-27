/**
 * @jest-environment jsdom
 */
import {
    loadGitHubToken,
    saveGitHubToken,
    clearGitHubToken,
    isValidGitHubToken,
} from '../src/utils/githubToken.js';

describe('githubToken utils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('saves and loads token', () => {
        saveGitHubToken('abc');
        expect(loadGitHubToken()).toBe('abc');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe('abc');
    });

    test('clears token', () => {
        saveGitHubToken('xyz');
        clearGitHubToken();
        expect(loadGitHubToken()).toBe('');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe('');
    });

    test('validates token format', () => {
        expect(isValidGitHubToken('')).toBe(false);
        expect(isValidGitHubToken('ghp_short')).toBe(false);
        expect(isValidGitHubToken('ghp_123456789012345678901234567890123456')).toBe(true);
        expect(isValidGitHubToken('github_pat_abcdefghijklmnopqrstuvwxyz')).toBe(true);
    });
});
