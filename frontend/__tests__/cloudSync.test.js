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
    beforeEach(async () => {
        await resetGameState();
        global.fetch = jest.fn();
    });

    test('uploadGameStateToGist always posts a new gist and clears stored id', async () => {
        const state = loadGameState();
        state.cloudSync = { gistId: 'a' };
        await saveGameState(state);
        await saveGitHubToken('ghp_x'.padEnd(20, 't'));
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'new-gist-id' }),
        });
        const id = await uploadGameStateToGist('ghp_x'.padEnd(20, 't'));
        expect(id).toBe('new-gist-id');
        const request = global.fetch.mock.calls[0];
        expect(request[0]).toBe('https://api.github.com/gists');
        const body = JSON.parse(request[1].body);
        expect(body.files).toBeDefined();
        expect(await loadCloudGistId()).toBe('');
    });

    test('uploadGameStateToGist strips secrets from payload', async () => {
        const state = loadGameState();
        state.github = { token: 'secret-token' };
        await saveGameState(state);
        await saveGitHubToken('ghp_x'.padEnd(20, 't'));
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'id-1' }),
        });
        await uploadGameStateToGist('ghp_x'.padEnd(20, 't'));
        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        const content = JSON.parse(Object.values(body.files)[0].content);
        expect(content.github).toBeUndefined();
        expect(JSON.stringify(content)).not.toContain('secret-token');
    });

    test('downloadGameStateFromGist updates state', async () => {
        await saveGitHubToken('ghp_x');
        const encoded = btoa(JSON.stringify({ quests: { q: true }, inventory: {}, processes: {} }));
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    files: { 'dspace-save-2023-01-01T00-00-00Z.txt': { content: encoded } },
                }),
        });
        await downloadGameStateFromGist('ghp_x', '1');
        expect(loadGameState().quests.q).toBe(true);
        expect(await loadCloudGistId()).toBe('1');
    });

    test('clearCloudGistId resets stored id', async () => {
        const state = loadGameState();
        state.cloudSync = { gistId: '42' };
        await saveGameState(state);
        await clearCloudGistId();
        expect(await loadCloudGistId()).toBe('');
        expect(loadGameState().cloudSync.gistId).toBe('');
    });
});
