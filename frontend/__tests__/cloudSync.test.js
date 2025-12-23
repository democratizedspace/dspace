/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    uploadGameStateToGist,
    downloadGameStateFromGist,
    loadCloudGistId,
    clearCloudGistId,
} from '../src/utils/cloudSync.js';
import { saveGameState, loadGameState, resetGameState } from '../src/utils/gameState/common.js';
import { saveGitHubToken } from '../src/utils/githubToken.js';

const decodeContent = (encoded) => JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));

describe('cloudSync', () => {
    beforeEach(async () => {
        await resetGameState();
        global.fetch = vi.fn();
    });

    it('uploads a sanitized backup as a new gist with timestamped filename', async () => {
        await saveGitHubToken('ghp_x');
        const state = loadGameState();
        state.github = { token: 'secret-token', note: 'keep' };
        await saveGameState(state);

        global.fetch.mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    id: '1',
                    created_at: '2025-01-01T00:00:00Z',
                    html_url: 'https://gist.github.com/1',
                    files: {},
                }),
        });

        const gist = await uploadGameStateToGist(
            'ghp_x',
            global.fetch,
            new Date('2025-01-01T00:00:00Z')
        );

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.github.com/gists',
            expect.objectContaining({ method: 'POST' })
        );
        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        const [fileName, fileData] = Object.entries(body.files)[0];
        expect(fileName).toBe('dspace-save-2025-01-01T00-00-00Z.txt');
        expect(body.description).toBe('DSPACE Cloud Sync backup');
        expect(decodeContent(fileData.content).github).toBeUndefined();
        expect(gist.id).toBe('1');
        expect(await loadCloudGistId()).toBe('');
    });

    it('downloads the newest backup file format', async () => {
        await saveGitHubToken('ghp_y');
        const encoded = Buffer.from(
            JSON.stringify({ quests: { q: true }, inventory: {}, processes: {} }),
            'utf8'
        ).toString('base64');

        global.fetch.mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    files: {
                        'dspace-save-2025-01-02T00-00-00Z.txt': { filename: '', content: encoded },
                    },
                }),
        });

        await downloadGameStateFromGist('ghp_y', '123');
        expect(loadGameState().quests.q).toBe(true);
        expect(await loadCloudGistId()).toBe('123');
    });

    it('clearCloudGistId resets stored id', async () => {
        const state = loadGameState();
        state.cloudSync = { gistId: '42' };
        await saveGameState(state);
        await clearCloudGistId();
        expect(await loadCloudGistId()).toBe('');
        expect(loadGameState().cloudSync.gistId).toBe('');
    });
});
