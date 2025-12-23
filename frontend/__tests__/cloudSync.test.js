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
import { formatBackupFilename } from '../src/lib/cloudsync/githubGists';
import { saveGameState, loadGameState, resetGameState } from '../src/utils/gameState/common.js';
import { saveGitHubToken } from '../src/utils/githubToken.js';

describe('cloudSync', () => {
    beforeEach(async () => {
        await resetGameState();
        global.fetch = jest.fn();
    });

    test('uploadGameStateToGist always creates a new gist and clears stored id', async () => {
        await saveGitHubToken('ghp_mocktokenmocktoken1234');
        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    id: '1',
                    html_url: 'https://gist.github.com/1',
                    created_at: '2024',
                }),
        });

        const gist = await uploadGameStateToGist(undefined, fetchSpy);
        expect(gist.id).toBe('1');
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.github.com/gists',
            expect.objectContaining({ method: 'POST' })
        );
        expect(await loadCloudGistId()).toBe('');
    });

    test('downloadGameStateFromGist updates state', async () => {
        await saveGitHubToken('ghp_x');
        const encoded = btoa(JSON.stringify({ quests: { q: true }, inventory: {}, processes: {} }));
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    files: { [formatBackupFilename(new Date(0))]: { content: encoded } },
                }),
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

    test('upload payload omits github token', async () => {
        await saveGitHubToken('ghp_mocktokenmocktoken1234');
        const state = loadGameState();
        state.github = { token: 'secret' };
        await saveGameState(state);

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    id: '2',
                    html_url: 'https://gist.github.com/2',
                    created_at: '2024',
                }),
        });

        await uploadGameStateToGist(undefined, fetchSpy);

        const [, options] = fetchSpy.mock.calls[0];
        const body = JSON.parse(options.body);
        const filename = Object.keys(body.files)[0];
        const decoded = JSON.parse(atob(body.files[filename].content));
        expect(decoded.github).toBeUndefined();
    });

    test('formatBackupFilename uses safe timestamp', () => {
        const filename = formatBackupFilename(new Date('2025-12-22T20:31:12Z'));
        expect(filename).toBe('dspace-save-2025-12-22T20-31-12Z.txt');
        expect(filename).not.toContain(':');
    });
});
