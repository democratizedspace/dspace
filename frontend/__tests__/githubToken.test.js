/**
 * @jest-environment jsdom
 */
import { loadGitHubToken, saveGitHubToken, clearGitHubToken } from '../src/utils/githubToken.js';

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
});
