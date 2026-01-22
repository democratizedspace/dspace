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
import {
    saveGameState,
    loadGameState,
    resetGameState,
    buildGameStateBackupEnvelope,
    encodeBackupEnvelope,
} from '../src/utils/gameState/common.js';
import { saveGitHubToken } from '../src/utils/githubToken.js';
import { db } from '../src/utils/customcontent.js';

describe('cloudSync', () => {
    beforeEach(async () => {
        await resetGameState();
        global.fetch = jest.fn();
    });

    test('uploadGameStateToGist always creates new backup without secrets', async () => {
        await saveGitHubToken('ghp_x');
        await db.items.add({ id: 'item-1', name: 'Custom item' });
        await db.processes.add({ id: 'process-1', title: 'Custom process' });
        await db.quests.add({ id: 'quest-1', title: 'Custom quest' });
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
        const decoded = JSON.parse(atob(content));
        expect(JSON.stringify(decoded).includes('ghp_secret')).toBe(false);
        expect(decoded.customContent.items[0].id).toBe('item-1');
        expect(decoded.customContent.processes[0].id).toBe('process-1');
        expect(decoded.customContent.quests[0].id).toBe('quest-1');
        expect(await loadCloudGistId()).toBe('');
    });

    test('downloadGameStateFromGist updates state', async () => {
        await saveGitHubToken('ghp_x');
        const customContent = {
            schemaVersion: 1,
            timestamp: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 0 },
            items: [{ id: 'custom-1', name: 'Cloud item' }],
            processes: [],
            quests: [],
            images: [],
        };
        const envelope = buildGameStateBackupEnvelope({
            stateOverride: { quests: { q: true }, inventory: {}, processes: {} },
        });
        envelope.customContent = customContent;
        const encoded = encodeBackupEnvelope(envelope);
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: { 'dspace-save.json': { content: encoded } } }),
        });
        await downloadGameStateFromGist('ghp_x', '1');
        expect(loadGameState().quests.q).toBe(true);
        const item = await db.items.get('custom-1');
        expect(item.name).toBe('Cloud item');
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
