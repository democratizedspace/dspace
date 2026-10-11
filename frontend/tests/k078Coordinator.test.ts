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

test('B05 normal startup provides lightweight metadata without dropping credential authority', async () => {
    expect(localStorage.getItem('gameStateLite')).toBeTruthy();
    await common.saveCredential('github', 'SENTINEL_STARTUP');
    await common.clearCredential('github');
    await common.closeGameStateDatabaseForTesting();
    vi.resetModules();
    common = await import('../src/utils/gameState/common.js');
    await common.ready;
    const db = await storage.openManagedGameDB();
    expect(
        storage.credentialAuthority((await storage.readManagedGame(db)).meta).github.cleared
    ).toBe(true);
    db.close();
    expect(localStorage.getItem('gameStateLite')).toBeTruthy();
});

test('B06 pending writes are not replaced by their old local mirror', async () => {
    const first = common.loadGameState();
    first.processes.synthetic = { running: true };
    const a = common.saveGameState(first);
    expect(common.syncGameStateFromLocalIfStale(common.getGameStateChecksum())).toBe(false);
    const second = common.loadGameState();
    second.inventory.synthetic = 9;
    const b = common.saveGameState(second);
    await Promise.all([a, b]);
    expect(common.loadGameState().processes.synthetic.running).toBe(true);
    expect(common.loadGameState().inventory.synthetic).toBe(9);
});

test('C04 gameplay queued during deliberate credential saves preserves both mutations', async () => {
    const credentialA = common.saveCredential('github', 'SENTINEL_QUEUED_GH');
    const credentialB = common.saveCredential('openAI', 'SENTINEL_QUEUED_AI');
    const next = common.loadGameState();
    next.inventory.synthetic = 19;
    const gameplay = common.saveGameState(next);
    await Promise.all([credentialA, credentialB, gameplay]);
    expect(common.loadGameState().inventory.synthetic).toBe(19);
    expect(common.loadGameState().github.token).toBe('SENTINEL_QUEUED_GH');
    expect(common.loadGameState().openAI.apiKey).toBe('SENTINEL_QUEUED_AI');
});

test('C04 consecutive gameplay snapshots remain distinct while a credential save is pending', async () => {
    const credential = common.saveCredential('github', 'SENTINEL_PENDING');
    const first = common.loadGameState();
    first.processes.synthetic = { running: true };
    const a = common.saveGameState(first);
    const second = common.loadGameState();
    second.inventory.synthetic = 23;
    const b = common.saveGameState(second);
    await Promise.all([credential, a, b]);
    expect(common.loadGameState().processes.synthetic.running).toBe(true);
    expect(common.loadGameState().inventory.synthetic).toBe(23);
});

test('B05 game-only localStorage fallback is explicit, fail-closed and propagates quota errors', async () => {
    await common.saveCredential('github', 'SENTINEL_FALLBACK');
    vi.spyOn(storage, 'openManagedGameDB').mockRejectedValue(new Error('synthetic unavailable'));
    await expect(
        common.importGameStateString(JSON.stringify({ inventory: { synthetic: 31 } }))
    ).resolves.toMatchObject({ status: 'best-effort', credentialsDisabled: true });
    expect(localStorage.getItem('gameState')).not.toContain('SENTINEL_');
    expect(localStorage.getItem('gameStateBackup')).not.toContain('SENTINEL_');
    const before = localStorage.getItem('gameState');
    await expect(common.importGameStateString(envelope())).rejects.toThrow();
    expect(localStorage.getItem('gameState')).toBe(before);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('synthetic quota');
    });
    await expect(common.importGameStateString('{}')).rejects.toThrow('synthetic quota');
});

test('B06 later credential saving cannot overtake two earlier gameplay saves', async () => {
    const first = common.loadGameState();
    first.inventory.synthetic = 1;
    const a = common.saveGameState(first);
    const second = common.loadGameState();
    second.inventory.synthetic = 2;
    const b = common.saveGameState(second);
    const credential = common.saveCredential('github', 'SENTINEL_AFTER_GAMEPLAY');
    await Promise.all([a, b, credential]);
    expect(common.loadGameState().inventory.synthetic).toBe(2);
    const db = await storage.openManagedGameDB();
    expect((await storage.readManagedGame(db)).state.inventory.synthetic).toBe(2);
    db.close();
});

test('B02 rejected predecessor restores the latest optimistic gameplay snapshot', async () => {
    const before = common.loadGameState();
    vi.spyOn(storage, 'commitManagedGame').mockRejectedValueOnce(
        new Error('synthetic write failure')
    );
    const first = common.loadGameState();
    first.inventory.synthetic = 41;
    const a = common.saveGameState(first);
    const second = common.loadGameState();
    second.inventory.synthetic = 42;
    const b = common.saveGameState(second);
    const results = await Promise.allSettled([a, b]);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(common.loadGameState().inventory).toEqual(before.inventory);
});

test('C04 rejected credential dependency restores optimistic gameplay', async () => {
    const before = common.loadGameState();
    vi.spyOn(storage, 'commitManagedGame').mockRejectedValueOnce(
        new Error('synthetic credential failure')
    );
    const credential = common.saveCredential('github', 'SENTINEL_FAILED_SAVE');
    const next = common.loadGameState();
    next.inventory.synthetic = 51;
    const gameplay = common.saveGameState(next);
    const results = await Promise.allSettled([credential, gameplay]);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(common.loadGameState().inventory).toEqual(before.inventory);
});

test('C02 legacy QA cleanup preserves a V2 save and restores its skip marker', async () => {
    localStorage.setItem(
        'gameState',
        JSON.stringify({ versionNumberString: '2.1', inventory: { '3': 1 } })
    );
    localStorage.setItem(
        'gameStateBackup',
        JSON.stringify({ versionNumberString: '3', inventory: {} })
    );
    const { clearV3GameStateStorage } = await import('../src/utils/legacySaveSeeding');
    await clearV3GameStateStorage();
    expect(localStorage.getItem('legacyV2Seeded')).toBe('true');
    expect(JSON.parse(localStorage.getItem('gameState')!).versionNumberString).toBe('2.1');
    expect(localStorage.getItem('gameStateBackup')).toBeNull();
});
