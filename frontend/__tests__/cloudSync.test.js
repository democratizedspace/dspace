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
import { db } from '../src/utils/customcontent.js';
import { getItems, getProcesses, getQuests } from '../src/utils/indexeddb.js';
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

    test('cloud sync includes custom content and restores it on download', async () => {
        await saveGitHubToken('ghp_x');
        await db.items.add({ id: 'item-1', name: 'Custom Item' });
        await db.processes.add({
            id: 'process-1',
            title: 'Custom Process',
            duration: 60,
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });
        await db.quests.add({
            id: 'quest-1',
            title: 'Custom Quest',
            description: 'Quest description',
            start: 'start',
            dialogue: [{ id: 'start', text: 'Hello', options: [{ type: 'finish', text: 'Done' }] }],
        });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    id: 'new-id',
                    created_at: '2024-01-02T03:04:05Z',
                    html_url: 'https://gist.github.com/new-id',
                }),
        });

        await uploadGameStateToGist();
        const [, requestInit] = global.fetch.mock.calls[0];
        const body = JSON.parse(requestInit.body);
        const content = Object.values(body.files)[0].content;
        const decoded = JSON.parse(atob(content));
        const customContent = JSON.parse(atob(decoded.payload.customContentBackup));

        expect(customContent.items.map((item) => item.id)).toContain('item-1');
        expect(customContent.processes.map((process) => process.id)).toContain('process-1');
        expect(customContent.quests.map((quest) => quest.id)).toContain('quest-1');

        await new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase('CustomContent');
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            request.onblocked = () => resolve();
        });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    files: { 'dspace-save.json': { content } },
                }),
        });

        await downloadGameStateFromGist('ghp_x', '1');
        const [items, processes, quests] = await Promise.all([
            getItems(),
            getProcesses(),
            getQuests(),
        ]);

        expect(items.map((item) => item.id)).toContain('item-1');
        expect(processes.map((process) => process.id)).toContain('process-1');
        expect(quests.map((quest) => quest.id)).toContain('quest-1');
        expect(loadGameState().customContentBackup).toBeUndefined();
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
