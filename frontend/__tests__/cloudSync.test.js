/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    uploadGameStateToGist,
    downloadGameStateFromGist,
    loadCloudGistId,
    clearCloudGistId,
} from '../src/utils/cloudSync.js';
import { saveGameState, loadGameState, resetGameState } from '../src/utils/gameState/common.js';
import { saveGitHubToken } from '../src/utils/githubToken.js';

describe('cloudSync', () => {
    beforeEach(() => {
        resetGameState();
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
        expect(await loadCloudGistId()).toBe('1');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.github.com/gists',
            expect.any(Object)
        );
    });

    test('uploadGameStateToGist patches existing gist', async () => {
        const state = loadGameState();
        state.cloudSync = { gistId: 'a' };
        await saveGameState(state);
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
        expect(await loadCloudGistId()).toBe('1');
    });

    test('clearCloudGistId resets stored id', async () => {
        const state = loadGameState();
        state.cloudSync = { gistId: '42' };
        await saveGameState(state);
        clearCloudGistId();
        expect(await loadCloudGistId()).toBe('');
        expect(loadGameState().cloudSync.gistId).toBe('');
    });
});
