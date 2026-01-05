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

    test('uploadGameStateToGist always creates new backup without secrets', async () => {
        await saveGitHubToken('ghp_x');
        const state = loadGameState();
        state.github = { token: 'ghp_secret' };
        state.cloudSync = { gistId: 'existing' };
        await saveGameState(state);

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    id: 'new-id',
                    created_at: '2024-01-02T03:04:05Z',
                    html_url: 'https://gist.github.com/new-id',
                }),
        });

        const result = await uploadGameStateToGist();
        const [, requestInit] = global.fetch.mock.calls[0];
        const body = JSON.parse(requestInit.body);

        expect(result.id).toBe('new-id');
        expect(body.description).toBe('DSPACE Cloud Sync backup');
        expect(body.files).toBeDefined();
        const content = Object.values(body.files)[0].content;
        const decoded = atob(content);
        expect(decoded.includes('ghp_secret')).toBe(false);
        expect(await loadCloudGistId()).toBe('');
    });

    test('uploadGameStateToGist keeps custom content payloads', async () => {
        await saveGitHubToken('ghp_x');
        const state = loadGameState();
        state.customItems = [{ id: 'c-item', name: 'Custom Item' }];
        state.customProcesses = [{ id: 'c-process', title: 'Custom Process' }];
        state.customQuests = [{ id: 'c-quest', title: 'Custom Quest' }];
        await saveGameState(state);

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    id: 'custom-content-backup',
                    created_at: '2024-02-02T03:04:05Z',
                    html_url: 'https://gist.github.com/custom-content-backup',
                }),
        });

        await uploadGameStateToGist();

        const [, requestInit] = global.fetch.mock.calls[0];
        const body = JSON.parse(requestInit.body);
        const content = Object.values(body.files)[0].content;
        const parsed = JSON.parse(atob(content));
        const payload = parsed.payload || parsed;

        expect(payload.customItems).toEqual(state.customItems);
        expect(payload.customProcesses).toEqual(state.customProcesses);
        expect(payload.customQuests).toEqual(state.customQuests);
    });

    test('downloadGameStateFromGist updates state', async () => {
        await saveGitHubToken('ghp_x');
        const encoded = btoa(JSON.stringify({ quests: { q: true }, inventory: {}, processes: {} }));
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: { 'dspace-save.json': { content: encoded } } }),
        });
        await downloadGameStateFromGist('ghp_x', '1');
        expect(loadGameState().quests.q).toBe(true);
        expect(await loadCloudGistId()).toBe('');
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
