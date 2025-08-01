/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import 'fake-indexeddb/auto';
import {
    uploadGameStateToGist,
    downloadGameStateFromGist,
    loadCloudGistId,
    clearCloudGistId,
} from '../src/utils/cloudSync.js';
import { saveGameState, loadGameState } from '../src/utils/gameState/common.js';
import { saveGitHubToken } from '../src/utils/githubToken.js';

describe('cloudSync', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = jest.fn();
    });

    test('uploadGameStateToGist creates gist when none exists', async () => {
        saveGitHubToken('ghp_x');
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: '1' }),
        });
        const id = await uploadGameStateToGist();
        expect(id).toBe('1');
        expect(loadCloudGistId()).toBe('1');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.github.com/gists',
            expect.any(Object)
        );
    });

    test('uploadGameStateToGist patches existing gist', async () => {
        localStorage.setItem('gameState', JSON.stringify({ cloudSync: { gistId: 'a' } }));
        saveGitHubToken('ghp_x');
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'a' }),
        });
        await uploadGameStateToGist();
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.github.com/gists/a',
            expect.any(Object)
        );
    });

    test('downloadGameStateFromGist updates state', async () => {
        saveGitHubToken('ghp_x');
        const encoded = btoa(JSON.stringify({ quests: { q: true }, inventory: {}, processes: {} }));
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: { 'dspace-save.json': { content: encoded } } }),
        });
        await downloadGameStateFromGist('ghp_x', '1');
        expect(loadGameState().quests.q).toBe(true);
        expect(loadCloudGistId()).toBe('1');
    });

    test('clearCloudGistId resets stored id', () => {
        localStorage.setItem('gameState', JSON.stringify({ cloudSync: { gistId: '42' } }));
        clearCloudGistId();
        expect(loadCloudGistId()).toBe('');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.cloudSync.gistId).toBe('');
    });
});
