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
import {
    createItem,
    createProcess,
    createQuest,
    getItem,
    getProcess,
    getQuest,
} from '../src/utils/customcontent.js';

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

    test('uploadGameStateToGist includes custom content snapshot', async () => {
        await saveGitHubToken('ghp_x');
        const itemId = await createItem('Custom Item', 'Custom item description');
        const processId = await createProcess('Custom Process', '1h', [], [], [
            { id: itemId, count: 1 },
        ]);
        const questId = await createQuest(
            'Custom Quest',
            'Custom quest description.',
            'data:image/png;base64,abc'
        );

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

        expect(decoded.customContent).toBeDefined();
        expect(decoded.customContent.items.some((item) => item.id === itemId)).toBe(true);
        expect(decoded.customContent.processes.some((process) => process.id === processId)).toBe(
            true
        );
        expect(decoded.customContent.quests.some((quest) => quest.id === questId)).toBe(true);
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

    test('downloadGameStateFromGist restores custom content', async () => {
        const customContent = {
            schemaVersion: 1,
            timestamp: '2024-01-01T00:00:00.000Z',
            counts: { items: 1, processes: 1, quests: 1, images: 0 },
            items: [
                {
                    id: 'custom-item-1',
                    name: 'Custom Item',
                    description: 'Custom item description.',
                },
            ],
            processes: [
                {
                    id: 'custom-process-1',
                    title: 'Custom Process',
                    duration: '1h',
                    requireItems: [],
                    consumeItems: [],
                    createItems: [{ id: 'custom-item-1', count: 1 }],
                },
            ],
            quests: [
                {
                    id: 'custom-quest-1',
                    title: 'Custom Quest',
                    description: 'Custom quest description.',
                    image: 'data:image/png;base64,abc',
                    npc: '/assets/npc/dChat.jpg',
                    start: 'start',
                    dialogue: [
                        {
                            id: 'start',
                            text: 'Start',
                            options: [{ type: 'finish', text: 'Finish quest' }],
                        },
                    ],
                    requiresQuests: [],
                },
            ],
            images: [],
        };
        const encoded = btoa(
            JSON.stringify({
                schemaVersion: 1,
                createdAt: '2024-01-02T03:04:05Z',
                providerHint: 'github-gist',
                payload: { quests: {}, inventory: {}, processes: {} },
                customContent,
            })
        );

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: { 'dspace-save.json': { content: encoded } } }),
        });

        await downloadGameStateFromGist('ghp_x', '1');
        await expect(getItem('custom-item-1')).resolves.toMatchObject({
            id: 'custom-item-1',
        });
        await expect(getProcess('custom-process-1')).resolves.toMatchObject({
            id: 'custom-process-1',
        });
        await expect(getQuest('custom-quest-1')).resolves.toMatchObject({ id: 'custom-quest-1' });
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
