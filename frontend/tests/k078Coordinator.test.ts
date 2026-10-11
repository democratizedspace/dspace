/* eslint-disable @typescript-eslint/no-explicit-any -- Synthetic fault injection exercises heterogeneous IDB records and module boundaries. */
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
let common: any, storage: any;
beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('indexedDB', new IDBFactory());
    localStorage.clear();
    vi.stubGlobal(
        'fetch',
        vi.fn(() => {
            throw new Error('network forbidden');
        })
    );
    common = await import('../src/utils/gameState/common.js');
    storage = await import('../src/utils/managedImportStorage.js');
    await common.ready;
    await common.resetGameState();
    const { openCustomContentDB } = await import('../src/utils/indexeddb.js');
    const db = await openCustomContentDB();
    db.close();
});
afterEach(async () => {
    vi.restoreAllMocks();
    await common.closeGameStateDatabaseForTesting();
    vi.unstubAllGlobals();
});
const envelope = () =>
    JSON.stringify({
        schemaVersion: 1,
        payload: { inventory: { synthetic: 2 }, github: { token: 'SENTINEL_IMPORTED' } },
        customContent: { schemaVersion: 1, items: [{ id: 'item-A', name: 'Synthetic item' }] },
    });

test('B04 actual coordinator reports partial, supports explicit recovery and idempotent retry', async () => {
    await common.saveCredential('github', 'SENTINEL_DESTINATION');
    const before = common.loadGameState();
    const commit = vi
        .spyOn(storage, 'commitCustomImport')
        .mockRejectedValueOnce(new Error('injected'));
    await expect(common.importGameStateString(envelope())).rejects.toMatchObject({
        code: 'partial',
        committed: ['game'],
        recovery: 'game',
    });
    expect(common.loadGameState().inventory.synthetic).toBe(2);
    await common.recoverImportGameState();
    expect(common.loadGameState().inventory).toEqual(before.inventory);
    expect(common.loadGameState().github.token).toBe('SENTINEL_DESTINATION');
    commit.mockRestore();
    await expect(common.importGameStateString(envelope())).resolves.toMatchObject({
        status: 'complete',
    });
    await expect(common.importGameStateString(envelope())).resolves.toMatchObject({
        status: 'complete',
    });
    const custom = await storage.preflightCustomImport();
    expect(custom.snapshot.items).toHaveLength(1);
    custom.db.close();
});
test('B04 recovery refuses a newer save', async () => {
    vi.spyOn(storage, 'commitCustomImport').mockRejectedValueOnce(new Error('injected'));
    await expect(common.importGameStateString(envelope())).rejects.toMatchObject({
        code: 'partial',
    });
    const newer = common.loadGameState();
    newer.inventory.synthetic = 3;
    await common.saveGameState(newer);
    await expect(common.recoverImportGameState()).rejects.toMatchObject({
        code: 'recovery-stale-or-unavailable',
    });
    expect(common.loadGameState().inventory.synthetic).toBe(3);
});
test('B05 actual coordinator reports mirror-incomplete and explicit retry repairs mirrors only', async () => {
    const original = Storage.prototype.setItem;
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
        if (key === 'gameState') throw new Error('quota');
        return original.call(this, key, value);
    });
    await expect(common.importGameStateString(envelope())).rejects.toMatchObject({
        code: 'mirror-incomplete',
        committed: ['game', 'custom'],
        recovery: 'mirrors',
    });
    write.mockRestore();
    await common.recoverImportGameState();
    expect(JSON.parse(localStorage.getItem('gameState')!).inventory.synthetic).toBe(2);
    const custom = await storage.preflightCustomImport();
    expect(custom.snapshot.items).toHaveLength(1);
    custom.db.close();
});
test('B06 queued saves persist their own snapshots and backups', async () => {
    const first = common.loadGameState();
    first.inventory.synthetic = 1;
    const a = common.saveGameState(first);
    const second = common.loadGameState();
    second.inventory.synthetic = 2;
    const b = common.saveGameState(second);
    first.inventory.synthetic = 99;
    second.inventory.synthetic = 99;
    await Promise.all([a, b]);
    const db = await storage.openManagedGameDB();
    const persisted = await storage.readManagedGame(db);
    db.close();
    expect(persisted.state.inventory.synthetic).toBe(2);
    expect(persisted.backup.inventory.synthetic).toBe(1);
});
test('C02 Clear invalidates recovery, survives rollback and fresh module load', async () => {
    await common.saveCredential('github', 'SENTINEL_GITHUB_A');
    await common.saveCredential('openAI', 'SENTINEL_OPENAI_B');
    vi.spyOn(storage, 'commitCustomImport').mockRejectedValueOnce(new Error('injected'));
    await expect(common.importGameStateString(envelope())).rejects.toMatchObject({
        code: 'partial',
    });
    expect((await common.clearCredential('github')).status).toBe('complete');
    await expect(common.recoverImportGameState()).rejects.toThrow();
    await common.rollbackGameState();
    expect(common.loadGameState().github?.token).toBeUndefined();
    await common.closeGameStateDatabaseForTesting();
    vi.resetModules();
    common = await import('../src/utils/gameState/common.js');
    await common.ready;
    expect(common.loadGameState().github?.token).toBeUndefined();
    expect(common.loadGameState().openAI.apiKey).toBe('SENTINEL_OPENAI_B');
});
test('C06 whole export envelope and mocked gist body omit recognized sensitive extensions', async () => {
    await common.saveCredential('github', 'SENTINEL_GITHUB_A');
    const exported = common.exportGameStateString({
        customContent: {
            schemaVersion: 1,
            secret: 'SENTINEL_CUSTOM',
            items: [
                {
                    id: 'a',
                    apiKey: 'SENTINEL_ITEM',
                    extension: { password: 'SENTINEL_PASSWORD', safe: true },
                },
            ],
        },
    });
    const json = new TextDecoder().decode(Uint8Array.from(atob(exported), (c) => c.charCodeAt(0)));
    expect(json).not.toContain('SENTINEL_');
    expect(JSON.parse(json).customContent.items[0].extension.safe).toBe(true);
    const gist = await import('../src/lib/cloudsync/githubGists');
    const mockedFetch = vi.fn(async (_url: any, _options: any) => ({
        ok: true,
        json: async () => ({ id: 'synthetic-gist' }),
    }));
    await gist.createBackupGist({
        token: 'SENTINEL_GITHUB_A',
        content: exported,
        fetchImpl: mockedFetch as any,
    });
    const files = JSON.parse(mockedFetch.mock.calls[0][1].body).files;
    for (const file of Object.values(files) as { content: string }[]) {
        const decoded = new TextDecoder().decode(
            Uint8Array.from(atob(file.content), (c) => c.charCodeAt(0))
        );
        expect(decoded).not.toContain('SENTINEL_');
    }
});

test('C04 cached OpenAI prompt cannot launch after Clear', async () => {
    await common.saveCredential('openAI', 'SENTINEL_OPENAI_CACHED');
    const promptPayload = {
        gameState: common.loadGameState(),
        combinedMessages: [],
        contextSources: [],
    };
    await common.clearCredential('openAI');
    const client = vi.fn();
    vi.stubGlobal('__DSpaceOpenAIClient', client);
    const { GPT5Chat } = await import('../src/utils/openAI.js');
    await expect(GPT5Chat([], { promptPayload })).rejects.toMatchObject({
        code: 'credential-unavailable',
    });
    expect(client).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
});
