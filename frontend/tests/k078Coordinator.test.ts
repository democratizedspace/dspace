/* eslint-disable @typescript-eslint/no-explicit-any -- Synthetic fault injection exercises heterogeneous IDB records and module boundaries. */
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
let common: any, storage: any;
beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('indexedDB', new IDBFactory());
    // Cross-tab delivery is covered by the real-browser harness, not module-reset fixtures.
    vi.stubGlobal('BroadcastChannel', undefined);
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
    expect(common.getImportRecoveryStatus()).toBeNull();
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
    expect(JSON.parse(localStorage.getItem('gameStateLite')!).credentialEpochs.github.cleared).toBe(
        true
    );
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

test('C04 aborted credential transaction does not discard queued gameplay', async () => {
    vi.spyOn(storage, 'commitManagedGame').mockRejectedValueOnce(
        new Error('synthetic credential failure')
    );
    const credential = common.saveCredential('github', 'SENTINEL_FAILED_SAVE');
    const next = common.loadGameState();
    next.inventory.synthetic = 51;
    const gameplay = common.saveGameState(next);
    const results = await Promise.allSettled([credential, gameplay]);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('fulfilled');
    expect(common.loadGameState().inventory.synthetic).toBe(51);
    expect(common.loadGameState().github?.token).toBeUndefined();
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

test('B05 mirror refresh refuses partially propagated metadata', async () => {
    const before = common.loadGameState();
    const oldMeta = localStorage.getItem('gameStateLite');
    const next = structuredClone(before);
    next.inventory.synthetic = 88;
    await common.saveGameState(next);
    const completeMeta = localStorage.getItem('gameStateLite');
    // The checksum marker and state arrived, but the matching metadata has not.
    localStorage.setItem('gameStateLite', oldMeta!);
    expect(common.syncGameStateFromLocalIfStale('old-checksum')).toBe(false);
    localStorage.setItem('gameStateLite', completeMeta!);
    expect(common.syncGameStateFromLocalIfStale('old-checksum')).toBe(true);
});

test('C04 gameplay started during Clear advances to its scrubbed receipt', async () => {
    await common.saveCredential('github', 'SENTINEL_CLEAR_QUEUE');
    const clearing = common.clearCredential('github');
    const first = common.loadGameState();
    first.inventory.synthetic = 71;
    const a = common.saveGameState(first);
    const second = common.loadGameState();
    second.processes.synthetic = { running: true };
    const b = common.saveGameState(second);
    await Promise.all([clearing, a, b]);
    const db = await storage.openManagedGameDB();
    const persisted = await storage.readManagedGame(db);
    expect(persisted.state.inventory.synthetic).toBe(71);
    expect(persisted.state.processes.synthetic.running).toBe(true);
    expect(JSON.stringify(persisted)).not.toContain('SENTINEL_CLEAR_QUEUE');
    expect(common.getGameStateChecksum()).toBe(persisted.state._meta.checksum);
    db.close();
});

test('C04 snapshots captured before pending Clear remain stale and restore visible state', async () => {
    await common.saveCredential('github', 'SENTINEL_STALE_CLEAR');
    const old = common.loadGameState();
    old.inventory.synthetic = 72;
    const clearing = common.clearCredential('github');
    const saving = common.saveGameState(old);
    await expect(saving).rejects.toMatchObject({ code: 'stale-credential-epoch' });
    await clearing;
    expect(common.loadGameState().inventory.synthetic).not.toBe(72);
    expect(JSON.stringify(common.loadGameState())).not.toContain('SENTINEL_STALE_CLEAR');
});

test('C04 gameplay after two pending Clears keeps both providers cleared', async () => {
    await common.saveCredential('github', 'SENTINEL_MULTI_GH');
    await common.saveCredential('openAI', 'SENTINEL_MULTI_AI');
    const a = common.clearCredential('github');
    const b = common.clearCredential('openAI');
    const next = common.loadGameState();
    next.inventory.synthetic = 73;
    await Promise.all([a, b, common.saveGameState(next)]);
    expect(common.loadGameState().inventory.synthetic).toBe(73);
    expect(JSON.stringify(common.loadGameState())).not.toContain('SENTINEL_MULTI');
});

test('C04 GitHub token saving normalizes whitespace for subsequent launch checks', async () => {
    const { saveGitHubToken, loadGitHubToken } = await import('../src/utils/githubToken.js');
    await saveGitHubToken('  SENTINEL_TRIMMED  ');
    await expect(loadGitHubToken()).resolves.toBe('SENTINEL_TRIMMED');
    await expect(common.assertCredentialLaunch('github', 'SENTINEL_TRIMMED')).resolves.toBe(
        'SENTINEL_TRIMMED'
    );
});

test.each([false, true])(
    'C04 cross-tab refresh protects gameplay (remote progress: %s)',
    async (remoteProgress) => {
        await common.closeGameStateDatabaseForTesting();
        const channels: any[] = [],
            messages: any[] = [];
        class TestChannel {
            onmessage: any;
            constructor() {
                channels.push(this);
            }
            postMessage(data: any) {
                messages.push(data);
            }
            close() {}
        }
        vi.stubGlobal('BroadcastChannel', TestChannel);
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        await common.saveCredential('github', 'SENTINEL_REFRESH');
        const origin = common;
        const stale = origin.loadGameState();
        vi.resetModules();
        const remote = await import('../src/utils/gameState/common.js');
        await remote.ready;
        if (remoteProgress) {
            const changed = remote.loadGameState();
            changed.inventory.remote = 99;
            await remote.saveGameState(changed);
        }
        await remote.clearCredential('github');
        await remote.closeGameStateDatabaseForTesting();
        let saving: Promise<any> | undefined;
        let initiated = false;
        const unsubscribe = origin.state.subscribe((value: any) => {
            if (!initiated && !value.github?.token) {
                initiated = true;
                const fresh = origin.loadGameState();
                fresh.inventory.synthetic = 81;
                saving = origin.saveGameState(fresh);
            }
        });
        channels[0].onmessage({ data: messages.at(-1) });
        unsubscribe();
        expect(saving).toBeDefined();
        if (remoteProgress) {
            await expect(saving).rejects.toMatchObject({ code: 'stale-state' });
            expect(origin.loadGameState().inventory.remote).toBe(99);
            expect(origin.loadGameState().inventory.synthetic).toBeUndefined();
        } else {
            await saving;
            expect(origin.loadGameState().inventory.synthetic).toBe(81);
        }
        expect(JSON.stringify(origin.loadGameState())).not.toContain('SENTINEL_REFRESH');
        await expect(origin.saveGameState(stale)).rejects.toMatchObject({
            code: 'stale-credential-epoch',
        });
    }
);

test.each(['clear', 'save'])(
    'C04 local credential %s cannot overwrite remote gameplay',
    async (mode) => {
        await common.saveCredential('github', 'SENTINEL_LOCAL_AUTHORITY');
        const origin = common;
        vi.resetModules();
        const remote = await import('../src/utils/gameState/common.js');
        await remote.ready;
        const changed = remote.loadGameState();
        changed.inventory.remote = 101;
        await remote.saveGameState(changed);
        await remote.closeGameStateDatabaseForTesting();
        const credential =
            mode === 'clear'
                ? origin.clearCredential('github')
                : origin.saveCredential('github', 'SENTINEL_NEW_LOCAL');
        const oldGameplay = origin.loadGameState();
        oldGameplay.inventory.synthetic = 82;
        await expect(origin.saveGameState(oldGameplay)).rejects.toMatchObject({
            code: 'stale-state',
        });
        await credential;
        expect(origin.loadGameState().inventory.remote).toBe(101);
        expect(origin.loadGameState().inventory.synthetic).toBeUndefined();
        expect(origin.loadGameState().github?.token).toBe(
            mode === 'clear' ? undefined : 'SENTINEL_NEW_LOCAL'
        );
    }
);

test('B05 missing Web Locks loads and saves credential-free gameplay without IDB writes', async () => {
    await common.saveCredential('github', 'SENTINEL_DURABLE_NO_LOCK');
    const db = await storage.openManagedGameDB();
    const before = await storage.readManagedGame(db);
    db.close();
    await common.closeGameStateDatabaseForTesting();
    localStorage.setItem(
        'gameState',
        JSON.stringify({
            inventory: { synthetic: 91 },
            _meta: { lastUpdated: before.state._meta.lastUpdated + 1 },
            github: { token: 'SENTINEL_NO_LOCK' },
            openAI: { apiKey: 'SENTINEL_NO_LOCK_AI' },
        })
    );
    vi.stubGlobal('navigator', { locks: undefined });
    vi.resetModules();
    common = await import('../src/utils/gameState/common.js');
    await expect(common.ready).resolves.toBeUndefined();
    expect(common.isGameStateReady()).toBe(true);
    expect(common.loadGameState().inventory.synthetic).toBe(91);
    expect(JSON.stringify(common.loadGameState())).not.toContain('SENTINEL_');
    const next = common.loadGameState();
    next.inventory.synthetic = 92;
    await expect(common.saveGameState(next)).resolves.toMatchObject({
        status: 'best-effort',
        credentialsDisabled: true,
    });
    expect(JSON.parse(localStorage.getItem('gameState')!).inventory.synthetic).toBe(92);
    expect(localStorage.getItem('gameState')).not.toContain('SENTINEL_');
    await expect(
        common.assertCredentialLaunch('github', 'SENTINEL_DURABLE_NO_LOCK')
    ).rejects.toMatchObject({ code: 'credential-unavailable' });
    await expect(common.saveCredential('github', 'SENTINEL_REJECTED')).rejects.toMatchObject({
        code: 'storage-lock-unavailable',
    });
    await expect(common.importGameStateString('{}')).rejects.toMatchObject({
        code: 'storage-lock-unavailable',
    });
    const check = await storage.openManagedGameDB();
    expect(await storage.readManagedGame(check)).toEqual(before);
    check.close();
});

test('C03 launch waits behind a Clear queued after another managed operation', async () => {
    await common.saveCredential('github', 'SENTINEL_QUEUED_CLEAR');
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
        release = resolve;
    });
    const blocked = storage.serializeManagedMutation(() => barrier);
    const clear = common.clearCredential('github');
    const launch = common.assertCredentialLaunch('github', 'SENTINEL_QUEUED_CLEAR');
    const denied = expect(launch).rejects.toMatchObject({ code: 'credential-unavailable' });
    release();
    await blocked;
    await clear;
    await denied;
    expect(fetch).not.toHaveBeenCalled();
});

test('C03 a second module cannot launch ahead of a locally queued Clear', async () => {
    await common.saveCredential('github', 'SENTINEL_GLOBAL_CLEAR');
    vi.resetModules();
    const remoteStorage = await import('../src/utils/managedImportStorage.js');
    let globalQueue = Promise.resolve<unknown>(undefined);
    const request = vi.fn((_name: string, operation: () => unknown) => {
        const result = globalQueue.then(operation);
        globalQueue = result.catch(() => undefined);
        return result;
    });
    vi.stubGlobal('navigator', { locks: { request } });
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
        release = resolve;
    });
    const blocked = storage.serializeManagedMutation(() => barrier);
    const clear = common.clearCredential('github');
    const launch = remoteStorage.assertCredentialLaunch('github', 'SENTINEL_GLOBAL_CLEAR');
    const denied = expect(launch).rejects.toMatchObject({ code: 'credential-unavailable' });
    expect(request).toHaveBeenCalledTimes(3);
    release();
    await blocked;
    await clear;
    await denied;
    expect(fetch).not.toHaveBeenCalled();
});

test('B05 missing locks recovers IDB-only progress and retains subsequent fallback saves on reload', async () => {
    const initial = common.loadGameState();
    initial.inventory.idbOnly = 73;
    await common.saveGameState(initial);
    await common.saveCredential('github', 'SENTINEL_IDB_ONLY');
    const db = await storage.openManagedGameDB();
    const before = await storage.readManagedGame(db);
    db.close();
    localStorage.removeItem('gameState');
    localStorage.removeItem('gameStateBackup');
    await common.closeGameStateDatabaseForTesting();
    vi.stubGlobal('navigator', { locks: undefined });
    vi.resetModules();
    common = await import('../src/utils/gameState/common.js');
    await common.ready;
    expect(common.hasLoadedPersistedGameState()).toBe(true);
    expect(common.loadGameState().inventory.idbOnly).toBe(73);
    expect(JSON.stringify(common.loadGameState())).not.toContain('SENTINEL_');
    const next = common.loadGameState();
    next.inventory.idbOnly = 74;
    await common.saveGameState(next);
    await common.closeGameStateDatabaseForTesting();
    vi.resetModules();
    common = await import('../src/utils/gameState/common.js');
    await common.ready;
    expect(common.loadGameState().inventory.idbOnly).toBe(74);
    expect(JSON.stringify(common.loadGameState())).not.toContain('SENTINEL_');
    const check = await storage.openManagedGameDB();
    expect(await storage.readManagedGame(check)).toEqual(before);
    check.close();
});

test.each([false, true])(
    'B05 returning Web Locks retains fallback progress and durable credential authority (cleared=%s)',
    async (cleared) => {
        const locks = navigator.locks;
        await common.saveCredential('github', 'SENTINEL_DURABLE_RETURN');
        if (cleared) await common.clearCredential('github');
        await common.closeGameStateDatabaseForTesting();
        vi.stubGlobal('navigator', { locks: undefined });
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        const next = common.loadGameState();
        next.inventory.fallbackProgress = 83;
        await common.saveGameState(next);
        const local = JSON.parse(localStorage.getItem('gameState')!);
        local.github = { token: 'SENTINEL_UNTRUSTED_LOCAL' };
        localStorage.setItem('gameState', JSON.stringify(local));
        await common.closeGameStateDatabaseForTesting();
        vi.stubGlobal('navigator', { locks });
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.loadGameState().inventory.fallbackProgress).toBe(83);
        expect(common.loadGameState().github?.token).toBe(
            cleared ? undefined : 'SENTINEL_DURABLE_RETURN'
        );
        await common.saveCredential('openAI', 'SENTINEL_AFTER_RETURN');
        expect(common.loadGameState().inventory.fallbackProgress).toBe(83);
        await common.clearCredential('openAI');
        expect(common.loadGameState().inventory.fallbackProgress).toBe(83);
        const continued = common.loadGameState();
        continued.inventory.fallbackProgress = 84;
        await common.saveGameState(continued);
        const db = await storage.openManagedGameDB();
        const persisted = await storage.readManagedGame(db);
        db.close();
        expect(persisted.state.inventory.fallbackProgress).toBe(84);
        expect(persisted.state.github?.token).toBe(cleared ? undefined : 'SENTINEL_DURABLE_RETURN');
        expect(persisted.meta.credentialEpochs.github.cleared).toBe(cleared);
    }
);

test.each(['quest', 'bundle'])(
    'C03 direct %s submission normalizes the gate and Authorization header',
    async (kind) => {
        await common.saveCredential('github', 'SENTINEL_DIRECT_NORMALIZED');
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            text: async () => 'synthetic-denied',
        } as Response);
        const submit =
            kind === 'quest'
                ? (await import('../src/utils/submitQuestPR.js')).submitQuestPR
                : (await import('../src/utils/submitBundlePR.js')).submitBundlePR;
        await expect(submit('  SENTINEL_DIRECT_NORMALIZED  ', 'synthetic', '{}')).rejects.toThrow(
            'synthetic-denied'
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({
            Authorization: 'token SENTINEL_DIRECT_NORMALIZED',
        });
    }
);

test('A03 exported images use one representation and round-trip at the aggregate budget', async () => {
    const { default: rasters } = await import('./fixtures/k078Rasters.json');
    const { openCustomContentDB } = await import('../src/utils/indexeddb.js');
    const db = await openCustomContentDB();
    await storage.strictTransaction(db, ['items', 'quests'], 'readwrite', (tx: any) => {
        tx.objectStore('items').put({ id: 'raster-a', name: 'Synthetic A', image: rasters.png });
        tx.objectStore('items').put({ id: 'raster-b', name: 'Synthetic B', image: rasters.png });
        tx.objectStore('quests').put({
            id: 'raster-q',
            title: 'Synthetic Q',
            dialogue: [],
            image: rasters.png,
        });
    });
    db.close();
    const { buildCustomContentBackupData } = await import('../src/utils/customContentBackup.js');
    const exported = await buildCustomContentBackupData();
    expect(exported.images).toHaveLength(3);
    expect(
        [...exported.items, ...exported.quests].every((entity: any) => entity.image === undefined)
    ).toBe(true);
    const { prepareImport } = await import('../src/utils/importPreparation.js');
    const totalImageBytes = atob(rasters.png.split(',')[1]).length * 3;
    const plan = prepareImport(exported, {
        kind: 'custom',
        limits: { totalImageBytes, totalPixels: 3 },
    });
    expect(plan.customContent.items.every((entity: any) => entity.image === rasters.png)).toBe(
        true
    );
    expect(plan.customContent.quests[0].image).toBe(rasters.png);
    expect(() =>
        prepareImport(exported, {
            kind: 'custom',
            limits: { totalImageBytes: totalImageBytes - 1 },
        })
    ).toThrow('image-total-bytes');
    expect(fetch).not.toHaveBeenCalled();
});

test.each([
    ['unavailable', 'import'],
    ['mirror-failed', 'import'],
    ['unavailable', 'save'],
    ['mirror-failed', 'save'],
])('B05 %s storage: %s survives recovery/reload with a backward clock', async (mode, action) => {
    await common.saveCredential('github', 'SENTINEL_IMPORT_RELOAD');
    const beforeTime = common.loadGameState()._meta.lastUpdated;
    vi.spyOn(Date, 'now').mockReturnValue(beforeTime - 10000);
    const fault =
        mode === 'unavailable'
            ? vi
                  .spyOn(storage, 'openManagedGameDB')
                  .mockRejectedValueOnce(new Error('synthetic unavailable'))
            : vi.spyOn(storage, 'mirrorManagedGame').mockImplementationOnce(() => {
                  throw new Error('synthetic mirror failure');
              });
    const imported =
        action === 'import'
            ? common.importGameStateString(
                  JSON.stringify({ inventory: { restoredProgress: 97 }, _meta: { lastUpdated: 1 } })
              )
            : common.saveGameState({
                  ...common.loadGameState(),
                  inventory: { restoredProgress: 97 },
              });
    if (mode === 'unavailable')
        await expect(imported).resolves.toMatchObject({
            status: 'best-effort',
            credentialsDisabled: true,
        });
    else
        await expect(imported).rejects.toMatchObject({
            code: 'mirror-incomplete',
            committed: ['game'],
        });
    expect(common.loadGameState()._meta.lastUpdated).toBeGreaterThan(beforeTime);
    fault.mockRestore();
    await common.closeGameStateDatabaseForTesting();
    vi.resetModules();
    common = await import('../src/utils/gameState/common.js');
    await common.ready;
    expect(common.loadGameState().inventory.restoredProgress).toBe(97);
    expect(common.loadGameState().github.token).toBe('SENTINEL_IMPORT_RELOAD');
    const db = await storage.openManagedGameDB();
    expect((await storage.readManagedGame(db)).state.inventory.restoredProgress).toBe(97);
    db.close();
});

test.each([
    ['import', 'durable'],
    ['save', 'durable'],
    ['import', 'fallback'],
    ['save', 'fallback'],
    ['save', 'no-locks'],
])(
    'B05 %s (%s) uses retained timestamps after another tab writes identical gameplay',
    async (action, mode) => {
        await common.saveCredential('github', 'SENTINEL_DURABLE_TIME');
        const stale = common.loadGameState();
        const remoteTime = stale._meta.lastUpdated + 20000;
        const db = await storage.openManagedGameDB();
        const snapshot = await storage.readManagedGame(db);
        snapshot.state._meta.lastUpdated = remoteTime;
        snapshot.meta.lastUpdated = remoteTime;
        await storage.strictTransaction(db, ['state', 'meta'], 'readwrite', (tx: any) => {
            tx.objectStore('state').put(snapshot.state, 'root');
            tx.objectStore('meta').put(snapshot.meta, 'root');
        });
        storage.mirrorManagedGame(snapshot);
        expect(common.loadGameState()._meta.lastUpdated).toBeLessThan(remoteTime);
        expect(common.loadGameState()._meta.checksum).toBe(snapshot.state._meta.checksum);
        vi.spyOn(Date, 'now').mockReturnValue(stale._meta.lastUpdated - 10000);
        const locks = navigator.locks;
        const fault =
            mode === 'durable'
                ? vi.spyOn(storage, 'mirrorManagedGame').mockImplementationOnce(() => {
                      throw new Error('synthetic mirror failure');
                  })
                : mode === 'fallback'
                  ? vi
                        .spyOn(storage, 'openManagedGameDB')
                        .mockRejectedValueOnce(new Error('synthetic unavailable'))
                  : null;
        if (mode === 'no-locks') vi.stubGlobal('navigator', { locks: undefined });
        const next = { ...stale, inventory: { durableTimeProgress: 98 } };
        const write =
            action === 'import'
                ? common.importGameStateString(JSON.stringify(next))
                : common.saveGameState(next);
        if (mode === 'durable') {
            await expect(write).rejects.toMatchObject({
                code: 'mirror-incomplete',
                committed: ['game'],
            });
            expect((await storage.readManagedGame(db)).state._meta.lastUpdated).toBeGreaterThan(
                remoteTime
            );
        } else {
            await expect(write).resolves.toMatchObject({
                status: 'best-effort',
                credentialsDisabled: true,
            });
            expect(
                JSON.parse(localStorage.getItem('gameState')!)._meta.lastUpdated
            ).toBeGreaterThan(remoteTime);
            expect((await storage.readManagedGame(db)).state._meta.lastUpdated).toBe(remoteTime);
        }
        fault?.mockRestore();
        if (mode === 'no-locks') vi.stubGlobal('navigator', { locks });
        db.close();
        await common.closeGameStateDatabaseForTesting();
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.loadGameState().inventory.durableTimeProgress).toBe(98);
        expect(common.loadGameState().github.token).toBe('SENTINEL_DURABLE_TIME');
    }
);

test.each(['import', 'save', 'no-locks'])(
    'B05 recovered storage keeps %s fallback progress until startup reconciliation',
    async (action) => {
        await common.saveCredential('github', 'SENTINEL_RECOVERED_STORAGE');
        const locks = navigator.locks;
        const fault =
            action === 'no-locks'
                ? null
                : vi
                      .spyOn(storage, 'openManagedGameDB')
                      .mockRejectedValueOnce(new Error('synthetic unavailable'));
        if (action === 'no-locks') vi.stubGlobal('navigator', { locks: undefined });
        const next = { ...common.loadGameState(), inventory: { recoveredProgress: 101 } };
        await expect(
            action === 'import'
                ? common.importGameStateString(JSON.stringify(next))
                : common.saveGameState(next)
        ).resolves.toMatchObject({ status: 'best-effort', credentialsDisabled: true });
        fault?.mockRestore();
        if (action === 'no-locks') vi.stubGlobal('navigator', { locks });
        const db = await storage.openManagedGameDB();
        const durableBefore = await storage.readManagedGame(db);
        const continued = common.loadGameState();
        continued.inventory.recoveredProgress = 102;
        await expect(common.saveGameState(continued)).resolves.toMatchObject({
            status: 'best-effort',
        });
        expect(common.loadGameState().inventory.recoveredProgress).toBe(102);
        expect(await storage.readManagedGame(db)).toEqual(durableBefore);
        await expect(
            common.saveCredential('openAI', 'SENTINEL_BLOCKED_UNTIL_RELOAD')
        ).rejects.toMatchObject({ code: 'fallback-reload-required' });
        await expect(common.clearCredential('github')).resolves.toMatchObject({
            status: 'complete',
        });
        expect(common.loadGameState().inventory.recoveredProgress).toBe(102);
        continued.inventory.recoveredProgress = 103;
        await expect(common.saveGameState(continued)).resolves.toMatchObject({
            status: 'best-effort',
        });
        expect(common.loadGameState().github?.token).toBeUndefined();
        db.close();
        await common.closeGameStateDatabaseForTesting();
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.loadGameState().inventory.recoveredProgress).toBe(103);
        expect(common.loadGameState().github?.token).toBeUndefined();
        await expect(
            common.saveCredential('openAI', 'SENTINEL_AFTER_RELOAD')
        ).resolves.toMatchObject({ status: 'complete' });
        expect(common.loadGameState().inventory.recoveredProgress).toBe(103);
    }
);

test('B05 already queued saves remain in fallback after the first write loses storage', async () => {
    vi.spyOn(storage, 'openManagedGameDB').mockRejectedValueOnce(
        new Error('synthetic unavailable')
    );
    const first = { ...common.loadGameState(), inventory: { queuedFallback: 201 } };
    const firstWrite = common.saveGameState(first);
    const second = { ...common.loadGameState(), inventory: { queuedFallback: 202 } };
    const secondWrite = common.saveGameState(second);
    await expect(firstWrite).resolves.toMatchObject({ status: 'best-effort' });
    await expect(secondWrite).resolves.toMatchObject({ status: 'best-effort' });
    expect(common.loadGameState().inventory.queuedFallback).toBe(202);
    expect(JSON.parse(localStorage.getItem('gameState')!).inventory.queuedFallback).toBe(202);
});

test.each([false, true])(
    'B05 queued Clear cannot discard fallback progress (mirror failure=%s)',
    async (mirrorFails) => {
        await common.saveCredential('github', 'SENTINEL_QUEUED_CLEAR');
        vi.spyOn(storage, 'openManagedGameDB').mockRejectedValueOnce(
            new Error('synthetic unavailable')
        );
        const firstWrite = common.saveGameState({
            ...common.loadGameState(),
            inventory: { queuedClear: 301 },
        });
        const clear = common.clearCredential('github');
        const secondWrite = common.saveGameState({
            ...common.loadGameState(),
            inventory: { queuedClear: 302 },
        });
        await expect(firstWrite).resolves.toMatchObject({ status: 'best-effort' });
        if (mirrorFails)
            vi.spyOn(storage, 'mirrorManagedGame').mockImplementationOnce(() => {
                throw new Error('synthetic quota');
            });
        await expect(clear).resolves.toMatchObject({ status: 'complete' });
        if (mirrorFails) await expect(secondWrite).rejects.toThrow('synthetic quota');
        else await expect(secondWrite).resolves.toMatchObject({ status: 'best-effort' });
        const expected = mirrorFails ? 301 : 302;
        expect(common.loadGameState().inventory.queuedClear).toBe(expected);
        expect(common.loadGameState().github?.token).toBeUndefined();
        expect(JSON.parse(localStorage.getItem('gameState')!).inventory.queuedClear).toBe(expected);
        await common.closeGameStateDatabaseForTesting();
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.loadGameState().inventory.queuedClear).toBe(expected);
        expect(common.loadGameState().github?.token).toBeUndefined();
    }
);

test('B05 newer fallback saves stay behind older queued saves', async () => {
    vi.spyOn(storage, 'openManagedGameDB').mockRejectedValueOnce(
        new Error('synthetic unavailable')
    );
    const first = common.saveGameState({
        ...common.loadGameState(),
        inventory: { fallbackOrder: 401 },
    });
    let release!: () => void;
    const barrier = storage.serializeManagedMutation(
        () =>
            new Promise<void>((resolve) => {
                release = resolve;
            })
    );
    const second = common.saveGameState({
        ...common.loadGameState(),
        inventory: { fallbackOrder: 402 },
    });
    await first;
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    const third = common.saveGameState({
        ...common.loadGameState(),
        inventory: { fallbackOrder: 403 },
    });
    release();
    await Promise.all([barrier, second, third]);
    expect(common.loadGameState().inventory.fallbackOrder).toBe(403);
    expect(JSON.parse(localStorage.getItem('gameState')!).inventory.fallbackOrder).toBe(403);
});

test('B05 a failed queued credential Save does not discard later fallback gameplay', async () => {
    vi.spyOn(storage, 'openManagedGameDB').mockRejectedValueOnce(
        new Error('synthetic unavailable')
    );
    const first = common.saveGameState({
        ...common.loadGameState(),
        inventory: { fallbackCredential: 501 },
    });
    const credential = common.saveCredential('github', 'SENTINEL_REJECTED');
    const denied = expect(credential).rejects.toMatchObject({ code: 'fallback-reload-required' });
    const second = common.saveGameState({
        ...common.loadGameState(),
        inventory: { fallbackCredential: 502 },
    });
    await first;
    await denied;
    await expect(second).resolves.toMatchObject({ status: 'best-effort' });
    expect(common.loadGameState().inventory.fallbackCredential).toBe(502);
    expect(JSON.parse(localStorage.getItem('gameState')!).inventory.fallbackCredential).toBe(502);
    expect(common.loadGameState().github?.token).toBeUndefined();
});

test.each([false, true])(
    'B05 startup mirror failure retains working IndexedDB authority (reconcile=%s)',
    async (reconcile) => {
        await common.saveCredential('github', 'SENTINEL_STARTUP_MIRROR');
        if (reconcile) {
            const local = common.loadGameState();
            local.inventory.startupProgress = 601;
            local._meta.lastUpdated += 100;
            localStorage.setItem('gameState', JSON.stringify(local));
        }
        await common.closeGameStateDatabaseForTesting();
        vi.resetModules();
        const fault = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('synthetic localStorage unavailable');
        });
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.isUsingLocalStorage()).toBe(false);
        expect(common.loadGameState().github.token).toBe('SENTINEL_STARTUP_MIRROR');
        if (reconcile) expect(common.loadGameState().inventory.startupProgress).toBe(601);
        const next = common.loadGameState();
        next.inventory.startupProgress = 602;
        await expect(common.saveGameState(next)).rejects.toMatchObject({
            code: 'mirror-incomplete',
            committed: ['game'],
        });
        const db = await storage.openManagedGameDB();
        expect((await storage.readManagedGame(db)).state.inventory.startupProgress).toBe(602);
        db.close();
        fault.mockRestore();
        await common.closeGameStateDatabaseForTesting();
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.loadGameState().inventory.startupProgress).toBe(602);
    }
);

test.each(['unavailable', 'mirror-failed'])(
    'C03 failed credential Save (%s) does not poison queued gameplay',
    async (mode) => {
        await common.saveCredential('github', 'SENTINEL_OLD_DEPENDENCY');
        if (mode === 'unavailable')
            vi.spyOn(storage, 'openManagedGameDB').mockRejectedValueOnce(
                new Error('synthetic unavailable')
            );
        else
            vi.spyOn(storage, 'mirrorManagedGame').mockImplementationOnce(() => {
                throw new Error('synthetic mirror failure');
            });
        const credential = common.saveCredential('github', 'SENTINEL_NEW_DEPENDENCY');
        const denied = expect(credential).rejects.toThrow();
        const gameplay = common.saveGameState({
            ...common.loadGameState(),
            inventory: { afterCredentialFailure: 701 },
        });
        await denied;
        await expect(gameplay).resolves.toMatchObject({ status: 'complete' });
        const db = await storage.openManagedGameDB();
        const persisted = await storage.readManagedGame(db);
        expect(persisted.state.inventory.afterCredentialFailure).toBe(701);
        expect(persisted.state.github.token).toBe(
            mode === 'unavailable' ? 'SENTINEL_OLD_DEPENDENCY' : 'SENTINEL_NEW_DEPENDENCY'
        );
        db.close();
    }
);

test.each([false, true])(
    'B03 overlapping gameplay advances a committed predecessor despite mirror failure (both=%s)',
    async (both) => {
        const mirror = vi.spyOn(storage, 'mirrorManagedGame');
        const fail = () => {
            throw new Error('synthetic quota');
        };
        if (both) mirror.mockImplementation(fail);
        else mirror.mockImplementationOnce(fail);
        const first = common.saveGameState({
            ...common.loadGameState(),
            inventory: { mirrorQueue: 801 },
        });
        const firstFailure = expect(first).rejects.toMatchObject({
            code: 'mirror-incomplete',
            committed: ['game'],
        });
        const second = common.saveGameState({
            ...common.loadGameState(),
            inventory: { mirrorQueue: 802 },
        });
        const secondResult = both
            ? expect(second).rejects.toMatchObject({
                  code: 'mirror-incomplete',
                  committed: ['game'],
              })
            : expect(second).resolves.toMatchObject({ status: 'complete' });
        await Promise.all([firstFailure, secondResult]);
        const db = await storage.openManagedGameDB();
        expect((await storage.readManagedGame(db)).state.inventory.mirrorQueue).toBe(802);
        expect(common.loadGameState().inventory.mirrorQueue).toBe(802);
        db.close();
    }
);

test.each([
    { rewards: [{ id: 'unknown-synthetic-item', count: 1 }], code: 'unresolved-reference' },
    { rewards: [{ id: 'reward-item', count: '2' }], code: 'reference-count' },
    { rewards: [{ id: 'reward-item', count: -1 }], code: 'reference-count' },
    { rewards: [{ id: 'reward-item' }], code: 'reference-count' },
    { rewards: [{ id: 'reward-item', count: null }], code: 'reference-count' },
    { rewards: { id: 'reward-item', count: 1 }, code: 'reference-type' },
])('A04 rejects malformed quest rewards before any writes (%j)', async ({ rewards, code }) => {
    const before = common.loadGameState();
    const commit = vi.spyOn(storage, 'commitManagedGame');
    await expect(
        common.importGameStateString(
            JSON.stringify({
                schemaVersion: 1,
                payload: { inventory: { shouldNotImport: 1 } },
                customContent: {
                    schemaVersion: 1,
                    items: [{ id: 'reward-item', name: 'Synthetic reward' }],
                    quests: [{ id: 'reward-quest', rewards }],
                },
            })
        )
    ).rejects.toMatchObject({ code });
    expect(commit).not.toHaveBeenCalled();
    expect(common.loadGameState()).toEqual(before);
    const custom = await storage.preflightCustomImport();
    expect(custom.snapshot.quests).toHaveLength(0);
    custom.db.close();
});

test.each(['gameplay', 'credential'])(
    'B05 fallback carries the committed %s dependency timestamp after its mirror fails',
    async (kind) => {
        await common.saveCredential('github', 'SENTINEL_TIME_BASE');
        const db = await storage.openManagedGameDB();
        const previous = await storage.readManagedGame(db);
        const remoteTime = previous.state._meta.lastUpdated + 20000;
        previous.state._meta.lastUpdated = remoteTime;
        await storage.strictTransaction(db, ['state'], 'readwrite', (tx: any) =>
            tx.objectStore('state').put(previous.state, 'root')
        );
        const open = storage.openManagedGameDB;
        vi.spyOn(storage, 'openManagedGameDB')
            .mockImplementationOnce(open)
            .mockRejectedValueOnce(new Error('synthetic unavailable'));
        vi.spyOn(storage, 'mirrorManagedGame').mockImplementationOnce(() => {
            throw new Error('synthetic mirror');
        });
        const first =
            kind === 'gameplay'
                ? common.saveGameState({
                      ...common.loadGameState(),
                      inventory: { receiptTime: 901 },
                  })
                : common.saveCredential('github', 'SENTINEL_TIME_NEW');
        const failedMirror = expect(first).rejects.toMatchObject({ code: 'mirror-incomplete' });
        const second = common.saveGameState({
            ...common.loadGameState(),
            inventory: { receiptTime: 902 },
        });
        await failedMirror;
        await expect(second).resolves.toMatchObject({ status: 'best-effort' });
        expect(JSON.parse(localStorage.getItem('gameState')!)._meta.lastUpdated).toBeGreaterThan(
            (await storage.readManagedGame(db)).state._meta.lastUpdated
        );
        db.close();
        await common.closeGameStateDatabaseForTesting();
        vi.resetModules();
        common = await import('../src/utils/gameState/common.js');
        await common.ready;
        expect(common.loadGameState().inventory.receiptTime).toBe(902);
        expect(common.loadGameState().github.token).toBe(
            kind === 'gameplay' ? 'SENTINEL_TIME_BASE' : 'SENTINEL_TIME_NEW'
        );
    }
);

test('A04 unresolved dialogue process rejects before any write', async () => {
    const commit = vi.spyOn(storage, 'commitManagedGame');
    await expect(
        common.importGameStateString(
            JSON.stringify({
                schemaVersion: 1,
                payload: {},
                customContent: {
                    schemaVersion: 1,
                    quests: [
                        {
                            id: 'process-quest',
                            dialogue: [
                                {
                                    id: 'start',
                                    options: [
                                        {
                                            type: 'process',
                                            text: 'Synthetic',
                                            process: 'missing-synthetic-process',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            })
        )
    ).rejects.toMatchObject({ code: 'unresolved-reference' });
    expect(commit).not.toHaveBeenCalled();
});

test.each(['requirement', 'operation'])(
    'A04 malformed container %s rejects before any game/custom writes',
    async (kind) => {
        const commit = vi.spyOn(storage, 'commitManagedGame');
        const content =
            kind === 'requirement'
                ? {
                      quests: [
                          {
                              id: 'q',
                              requiresItems: [
                                  { id: 'contents', count: 1, containerItemId: 'missing' },
                              ],
                          },
                      ],
                  }
                : {
                      processes: [
                          {
                              id: 'p',
                              itemCountOperations: [
                                  {
                                      operation: 'invalid',
                                      itemId: 'contents',
                                      containerItemId: 'container',
                                      count: 1,
                                  },
                              ],
                          },
                      ],
                  };
        await expect(
            common.importGameStateString(
                JSON.stringify({
                    schemaVersion: 1,
                    payload: {},
                    customContent: {
                        schemaVersion: 1,
                        items: [
                            { id: 'contents' },
                            { id: 'container', itemCounts: { contents: 0 } },
                        ],
                        ...content,
                    },
                })
            )
        ).rejects.toThrow();
        expect(commit).not.toHaveBeenCalled();
        const custom = await storage.preflightCustomImport();
        expect(custom.snapshot.items).toHaveLength(0);
        custom.db.close();
    }
);

test.each(
    [
        ['github', 'gameState'],
        ['github', 'gameStateBackup'],
        ['openAI', 'gameState'],
        ['openAI', 'gameStateBackup'],
    ].flatMap(([kind, key]) =>
        ['{invalid synthetic JSON', '"corrupt"', '{"payload":null}'].map((raw) => [kind, key, raw])
    )
)(
    'C02 Clear repairs malformed owned %s %s mirror from scrubbed durable data (%s)',
    async (kind, key, raw) => {
        await common.saveCredential('github', 'SENTINEL_MALFORMED_GITHUB');
        await common.saveCredential('openAI', 'SENTINEL_MALFORMED_OPENAI');
        await common.saveGameState({
            ...common.loadGameState(),
            inventory: { preservedMalformed: 31 },
        });
        localStorage.setItem('unrelated-synthetic-setting', 'keep');
        localStorage.setItem(key, raw);
        await expect(common.clearCredential(kind)).resolves.toMatchObject({ status: 'complete' });
        const db = await storage.openManagedGameDB();
        const durable = await storage.readManagedGame(db);
        expect(JSON.parse(localStorage.getItem(key)!)).toEqual(
            durable[key === 'gameState' ? 'state' : 'backup']
        );
        expect(durable.state[kind]?.[kind === 'github' ? 'token' : 'apiKey']).toBeUndefined();
        expect(
            durable.state[kind === 'github' ? 'openAI' : 'github'][
                kind === 'github' ? 'apiKey' : 'token'
            ]
        ).toContain('SENTINEL_MALFORMED');
        expect(durable.state.inventory.preservedMalformed).toBe(31);
        expect(localStorage.getItem('unrelated-synthetic-setting')).toBe('keep');
        expect(durable.meta.credentialEpochs[kind].pending).toBe(false);
        db.close();
        await expect(
            common.saveCredential(kind, 'SENTINEL_NEW_AFTER_REPAIR')
        ).resolves.toMatchObject({ status: 'complete' });
    }
);

test('C02 Clear removes only a malformed backup mirror when no durable backup exists', async () => {
    localStorage.setItem('gameStateBackup', '{invalid synthetic JSON');
    localStorage.setItem('unrelated-synthetic-setting', 'keep');
    await expect(common.clearCredential('github')).resolves.toMatchObject({ status: 'complete' });
    expect(localStorage.getItem('gameStateBackup')).toBeNull();
    expect(localStorage.getItem('unrelated-synthetic-setting')).toBe('keep');
});
