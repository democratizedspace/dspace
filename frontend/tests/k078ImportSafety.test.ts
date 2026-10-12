/* eslint-disable @typescript-eslint/no-explicit-any -- Synthetic fault injection exercises heterogeneous IDB records and module boundaries. */
import rasters from './fixtures/k078Rasters.json';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
    prepareImport,
    prepareImportFile,
    IMPORT_LIMITS,
    inspectRaster,
} from '../src/utils/importPreparation.js';
import {
    strictTransaction,
    openManagedGameDB,
    readManagedGame,
    credentialAuthority,
    clearManagedCredential,
    commitManagedGame,
    mirrorManagedGame,
    assertCredentialLaunch,
    preflightCustomImport,
    commitCustomImport,
    serializeManagedMutation,
} from '../src/utils/managedImportStorage.js';

const png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOo1nUGAAISAOxqN5/dAAAAAElFTkSuQmCC';
const game = () => ({
    inventory: { synthetic: 1 },
    github: { token: 'SENTINEL_GITHUB_A' },
    openAI: { apiKey: 'SENTINEL_OPENAI_B' },
    _meta: { checksum: 'before' },
});
const custom = () => ({
    schemaVersion: 1,
    items: [{ id: 'item-A', name: 'Synthetic item', image: png }],
    processes: [],
    quests: [],
    images: [],
});
const stamp = (v: any) => {
    v._meta = { checksum: JSON.stringify(v.inventory || {}) };
};
const lightweight = (v: any) => ({ checksum: v?._meta?.checksum || '' });
const initialize = (name: string) =>
    new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(name, name === 'CustomContent' ? 3 : 2);
        req.onupgradeneeded = () => {
            for (const s of name === 'CustomContent'
                ? ['items', 'processes', 'quests', 'meta']
                : ['state', 'backup', 'meta'])
                req.result.createObjectStore(
                    s,
                    s === 'meta' || name !== 'CustomContent' ? undefined : { keyPath: 'id' }
                );
            if (name === 'CustomContent')
                req.transaction!.objectStore('meta').put(3, 'schemaVersion');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
async function seed() {
    const db = await initialize('dspaceGameState');
    await strictTransaction(db, ['state', 'backup', 'meta'], 'readwrite', (tx: any) => {
        tx.objectStore('state').put(game(), 'root');
        tx.objectStore('backup').put(game(), 'root');
        tx.objectStore('meta').put(
            { credentialEpochs: credentialAuthority(), extension: { synthetic: 'keep' } },
            'root'
        );
    });
    localStorage.setItem('gameState', JSON.stringify(game()));
    localStorage.setItem('gameStateBackup', JSON.stringify({ gameState: game() }));
    return db;
}
beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    localStorage.clear();
    Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: { request: (_: string, fn: () => unknown) => fn() },
    });
    vi.stubGlobal(
        'fetch',
        vi.fn(() => {
            throw new Error('network forbidden in synthetic tests');
        })
    );
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('K078 synthetic regressions', () => {
    test('A01 invalid transport parity has no storage effects', async () => {
        const text = '{"schemaVersion":1,"items":"bad"}';
        const open = vi.spyOn(indexedDB, 'open');
        for (const input of [text, btoa(text)])
            expect(() => prepareImport(input, { kind: 'custom' })).toThrow();
        await expect(
            prepareImportFile({ size: text.length, text: async () => text }, { kind: 'custom' })
        ).rejects.toThrow();
        expect(() =>
            prepareImport(JSON.stringify({ payload: {}, customContent: JSON.parse(text) }))
        ).toThrow();
        expect(open).not.toHaveBeenCalled();
        expect(localStorage.length).toBe(0);
    });
    test('A02 injected byte, depth, node, string, image and occurrence boundaries', async () => {
        const text = '{"a":"é"}';
        const size = new TextEncoder().encode(text).length;
        for (const transportBytes of [size, size + 1])
            expect(prepareImport(text, { limits: { transportBytes } })).toBeTruthy();
        expect(() => prepareImport(text, { limits: { transportBytes: size - 1 } })).toThrow();
        expect(() => prepareImport('{"a":{"b":1}}', { limits: { depth: 2 } })).toThrow();
        expect(() => prepareImport('{"a":1}', { limits: { nodes: 1 } })).toThrow();
        expect(() => prepareImport('{"a":"é"}', { limits: { stringBytes: 1 } })).toThrow();
        const textRead = vi.fn();
        await expect(
            prepareImportFile({ size: 10, text: textRead }, { limits: { transportBytes: 9 } })
        ).rejects.toThrow();
        expect(textRead).not.toHaveBeenCalled();
        const data = custom();
        data.items.push({ id: 'item-B', name: 'Synthetic', image: png });
        expect(() => prepareImport(data, { kind: 'custom', limits: { totalPixels: 1 } })).toThrow();
        expect(prepareImport(data, { kind: 'custom', limits: { totalPixels: 2 } })).toBeTruthy();
    });
    test('A03 parser integrity and redacted bounded errors', () => {
        for (const input of [
            '{"a":1,"a":2}',
            '{"__proto__":{}}',
            '[]',
            'null',
            '{"schemaVersion":2}',
            '{"a":1e999}',
            '/w==',
            '====',
        ]) {
            try {
                prepareImport(input);
                throw new Error('accepted');
            } catch (e: any) {
                expect(e.name).toBe('ImportPreparationError');
                expect(e.fields.length).toBeLessThanOrEqual(20);
                expect(e.message).not.toContain(input);
            }
        }
    });
    test('A04 sparse legacy records, duration and colliding IDs', () => {
        expect(
            prepareImport(
                { schemaVersion: 1, items: [{ id: 1 }], processes: [{ id: 'p', duration: 60 }] },
                { kind: 'custom' }
            ).customContent.items[0].id
        ).toBe('1');
        expect(() =>
            prepareImport({ schemaVersion: 1, items: [{ id: 1 }, { id: '1' }] }, { kind: 'custom' })
        ).toThrow();
        expect(() => prepareImport({ payload: { inventory: [] } })).toThrow();
        expect(() =>
            prepareImport(
                {
                    schemaVersion: 1,
                    images: [{ id: 'im', entityId: 'missing', entityType: 'item', dataUrl: png }],
                },
                { kind: 'custom' }
            )
        ).toThrow();
    });
    test('A05 raster metadata and canonical URL validation never fetch or render', () => {
        expect(
            inspectRaster(png.replace('image/png', 'IMAGE/PNG;charset=utf-8'), IMPORT_LIMITS, {
                bytes: 0,
                pixels: 0,
            })
        ).toBe(png);
        for (const image of [
            png.replace('image/png', 'image/jpeg'),
            'data:image/svg+xml;base64,PHN2Zz4=',
            'data:image/png;base64,TEST',
            'https://user:pass@example.com/a.png',
            '//example.com/a.png',
        ])
            expect(() =>
                prepareImport({ schemaVersion: 1, items: [{ id: 'a', image }] }, { kind: 'custom' })
            ).toThrow();
        expect(fetch).not.toHaveBeenCalled();
    });
    test('A06 existing preview markup and angle brackets remain rejected', () => {
        for (const name of ['<img>', '1 < 2'])
            expect(() =>
                prepareImport({ schemaVersion: 1, items: [{ id: 'a', name }] }, { kind: 'custom' })
            ).toThrow();
        for (const route of ['//evil.test', '/\\evil.test', 'https://evil.test/'])
            expect(() =>
                prepareImport(
                    { schemaVersion: 1, quests: [{ id: 'q', route }] },
                    { kind: 'custom' }
                )
            ).toThrow();
    });
    test('B01 invalid embedded section leaves seeded stores unchanged', async () => {
        const db = await seed(),
            before = await readManagedGame(db);
        expect(() =>
            prepareImport({ payload: game(), customContent: { schemaVersion: 1, items: false } })
        ).toThrow();
        expect(await readManagedGame(db)).toEqual(before);
        db.close();
    });
    test('B02 synchronous failures abort all database writes', async () => {
        const db = await seed(),
            before = await readManagedGame(db);
        await expect(
            strictTransaction(db, ['state', 'backup'], 'readwrite', (tx: any) => {
                tx.objectStore('state').put({ changed: true }, 'root');
                tx.objectStore('backup').put(() => {}, 'root');
            })
        ).rejects.toThrow();
        expect(await readManagedGame(db)).toEqual(before);
        db.close();
    });
    test('B03 request success is not a commit receipt; abort settles', async () => {
        const db = await seed();
        let requestSucceeded = false;
        await expect(
            strictTransaction(db, ['state'], 'readwrite', (tx: any, req: any) =>
                req(tx.objectStore('state').put(game(), 'root'), () => {
                    requestSucceeded = true;
                    tx.abort();
                })
            )
        ).rejects.toThrow();
        expect(requestSucceeded).toBe(true);
        db.close();
    });
    test('B04 second database failure preserves first commit and original custom rows', async () => {
        const db = await seed(),
            cdb = await initialize('CustomContent');
        cdb.close();
        const customPlan = await preflightCustomImport();
        const next = game();
        next.inventory.synthetic = 2;
        await commitManagedGame(db, {
            next,
            backup: game(),
            expectedChecksum: 'before',
            expectedEpochs: credentialAuthority(),
            stamp,
            lightweight,
        });
        const content = { items: [{ id: 'same' }, { id: 'same' }], processes: [], quests: [] };
        await expect(
            commitCustomImport(customPlan.db, content, customPlan.snapshot, false)
        ).rejects.toThrow();
        expect((await readManagedGame(db)).state.inventory.synthetic).toBe(2);
        const fresh = await preflightCustomImport();
        expect(fresh.snapshot.items).toEqual([]);
        fresh.db.close();
        customPlan.db.close();
        db.close();
    });
    test('B05 missing stores and mirror failure propagate', async () => {
        await expect(preflightCustomImport()).rejects.toThrow();
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota');
        });
        expect(() => mirrorManagedGame({ state: game(), backup: game(), meta: {} })).toThrow(
            'quota'
        );
    });
    test('B06 serialized work and stale revision conflicts', async () => {
        const db = await seed(),
            events: number[] = [];
        await Promise.all([
            serializeManagedMutation(async () => {
                events.push(1);
                await Promise.resolve();
                events.push(2);
            }),
            serializeManagedMutation(() => events.push(3)),
        ]);
        expect(events).toEqual([1, 2, 3]);
        await expect(
            commitManagedGame(db, {
                next: game(),
                backup: game(),
                expectedChecksum: 'stale',
                expectedEpochs: credentialAuthority(),
                stamp,
                lightweight,
            })
        ).rejects.toThrow('stale-state');
        db.close();
    });
    test.each(['github', 'openAI'])(
        'C01 clear %s across current, backup and legacy wrappers preserves unrelated data',
        async (kind) => {
            const db = await seed();
            localStorage.setItem('unrelated', 'keep');
            const result = await clearManagedCredential(db, kind, stamp, lightweight);
            expect(result.status).toBe('complete');
            const all =
                JSON.stringify(await readManagedGame(db)) +
                localStorage.getItem('gameState') +
                localStorage.getItem('gameStateBackup');
            expect(all).not.toContain(
                kind === 'github' ? 'SENTINEL_GITHUB_A' : 'SENTINEL_OPENAI_B'
            );
            expect(all).toContain(kind === 'github' ? 'SENTINEL_OPENAI_B' : 'SENTINEL_GITHUB_A');
            expect(localStorage.getItem('unrelated')).toBe('keep');
            expect((await readManagedGame(db)).meta.extension).toEqual({ synthetic: 'keep' });
            db.close();
        }
    );
    test('C02 clear scrubs rollback copy and rejects retained stale writes', async () => {
        const db = await seed();
        await clearManagedCredential(db, 'github', stamp, lightweight);
        const snapshot = await readManagedGame(db);
        expect(snapshot.backup.github.token).toBeUndefined();
        await expect(
            commitManagedGame(db, {
                next: game(),
                backup: game(),
                expectedEpochs: credentialAuthority(),
                stamp,
                lightweight,
            })
        ).rejects.toThrow('stale-credential-epoch');
        db.close();
    });
    test('C03 durable intent gates launches until malformed mirror repair can be written', async () => {
        const db = await seed();
        localStorage.setItem('gameStateBackup', '{bad');
        const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('synthetic quota');
        });
        expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
            'incomplete'
        );
        expect(credentialAuthority((await readManagedGame(db)).meta).github.pending).toBe(true);
        await expect(assertCredentialLaunch('github', 'SENTINEL_GITHUB_A')).rejects.toThrow();
        blocked.mockRestore();
        expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
            'complete'
        );
        expect(credentialAuthority((await readManagedGame(db)).meta).github.pending).toBe(false);
        db.close();
    });
    test('C04 deliberate later credential save advances epoch and old cached values cannot launch', async () => {
        const db = await seed();
        await clearManagedCredential(db, 'github', stamp, lightweight);
        const current = await readManagedGame(db),
            next = game();
        next.github.token = 'SENTINEL_GITHUB_NEW';
        const receipt = await commitManagedGame(db, {
            next,
            backup: current.state,
            expectedEpochs: credentialAuthority(current.meta),
            deliberateKind: 'github',
            stamp,
            lightweight,
        });
        expect(credentialAuthority(receipt.meta).github.epoch).toBe(2);
        await expect(assertCredentialLaunch('github', 'SENTINEL_GITHUB_A')).rejects.toThrow();
        await expect(assertCredentialLaunch('github', 'SENTINEL_GITHUB_NEW')).resolves.toBe(
            'SENTINEL_GITHUB_NEW'
        );
        db.close();
    });
    test('C05 no persistent undo or generation storage is created', async () => {
        const db = await seed();
        await clearManagedCredential(db, 'github', stamp, lightweight);
        expect(Array.from(db.objectStoreNames)).toEqual(['backup', 'meta', 'state']);
        expect(Object.keys(localStorage).sort()).toEqual([
            'gameState',
            'gameStateBackup',
            'gameStateChecksum',
            'gameStateLite',
        ]);
        db.close();
    });
    test('C06 import credentials and epoch authority are nonportable', () => {
        const plan = prepareImport({ payload: { ...game(), credentialEpochs: { github: 99 } } });
        expect(JSON.stringify(plan)).not.toContain('SENTINEL_');
        expect(JSON.stringify(plan)).not.toContain('credentialEpochs');
        expect(Object.isFrozen(plan.game)).toBe(true);
    });
});

describe('K078 complete injected boundaries and transaction faults', () => {
    const cases: Array<[string, any, number, any?]> = [
        ['transportBytes', '{"a":1}', 7],
        ['jsonBytes', '{"a":1}', 7],
        ['depth', { a: { b: 1 } }, 3],
        ['nodes', { a: 1, b: 2 }, 3],
        ['keys', { a: 1, b: 2 }, 2],
        ['entries', { inventory: { a: 1, b: 2 } }, 2],
        ['entities', { schemaVersion: 1, items: [{ id: 'a' }, { id: 'b' }] }, 2, 'custom'],
        ['stringBytes', { a: 'éé' }, 4],
        ['idBytes', { schemaVersion: 1, items: [{ id: 'abcd' }] }, 4, 'custom'],
        ['urlBytes', { schemaVersion: 1, items: [{ id: 'a', image: '/image.png' }] }, 10, 'custom'],
        [
            'images',
            {
                schemaVersion: 1,
                items: [{ id: 'a' }],
                images: [
                    { id: 'im-a', entityType: 'item', entityId: 'a', dataUrl: png },
                    { id: 'im-b', entityType: 'item', entityId: 'a', dataUrl: png },
                ],
            },
            2,
            'custom',
        ],
        ['imageBytes', custom(), atob(png.split(',')[1]).length, 'custom'],
        ['totalImageBytes', custom(), atob(png.split(',')[1]).length, 'custom'],
        ['pixels', custom(), 1, 'custom'],
        ['totalPixels', custom(), 1, 'custom'],
    ];
    test.each(cases)(
        'A02 %s: limit-minus-one, limit, limit-plus-one capacity',
        (name, input, size, kind = 'game') => {
            expect(() => prepareImport(input, { kind, limits: { [name]: size - 1 } })).toThrow();
            expect(() => prepareImport(input, { kind, limits: { [name]: size } })).not.toThrow();
            expect(() =>
                prepareImport(input, { kind, limits: { [name]: size + 1 } })
            ).not.toThrow();
        }
    );
    test.each(Object.entries(rasters))('A05 static or animated %s metadata', (name, image) => {
        const run = () =>
            prepareImport({ schemaVersion: 1, items: [{ id: 'a', image }] }, { kind: 'custom' });
        if (name.startsWith('animated')) expect(run).toThrow('image-animation');
        else expect(run).not.toThrow();
    });
    test.each([0, 1, 2])('B02 abort at request position %i', async (position) => {
        const db = await seed();
        const before = await readManagedGame(db);
        await expect(
            strictTransaction(db, ['state', 'backup', 'meta'], 'readwrite', (tx: any) => {
                ['state', 'backup', 'meta'].forEach((name, i) =>
                    tx.objectStore(name).put(i === position ? () => {} : { changed: true }, 'root')
                );
            })
        ).rejects.toThrow();
        expect(await readManagedGame(db)).toEqual(before);
        db.close();
    });
    test('B03 installs completion/error/abort handlers before requests', async () => {
        const db = await seed();
        await strictTransaction(db, ['state'], 'readwrite', (tx: any) => {
            expect(typeof tx.oncomplete).toBe('function');
            expect(typeof tx.onerror).toBe('function');
            expect(typeof tx.onabort).toBe('function');
            tx.objectStore('state').put(game(), 'root');
        });
        db.close();
    });
    test('B05 migration-required preflight leaves records untouched', async () => {
        const db = await initialize('CustomContent');
        await strictTransaction(db, ['meta'], 'readwrite', (tx: any) =>
            tx.objectStore('meta').put(2, 'schemaVersion')
        );
        await expect(preflightCustomImport()).rejects.toThrow('migration-required');
        db.close();
    });
    test.each(['gameStateBackup', 'gameState', 'gameStateLite', 'gameStateChecksum'])(
        'C03 interrupted mirror at %s keeps durable intent and disables launches',
        async (key) => {
            const db = await seed(),
                original = Storage.prototype.setItem;
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) {
                if (k === key) throw new Error('synthetic quota');
                return original.call(this, k, v);
            });
            expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
                'incomplete'
            );
            expect(credentialAuthority((await readManagedGame(db)).meta).github.pending).toBe(true);
            await expect(assertCredentialLaunch('github', 'SENTINEL_GITHUB_A')).rejects.toThrow();
            vi.restoreAllMocks();
            expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
                'complete'
            );
            db.close();
        }
    );
    test('C03 intent failure does not start Clear', async () => {
        const db = await seed();
        db.close();
        expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
            'not-started'
        );
        const reopened = await openManagedGameDB();
        expect((await readManagedGame(reopened)).state.github.token).toBe('SENTINEL_GITHUB_A');
        reopened.close();
    });
    test('C04 missing epoch authority fails closed for request launch', async () => {
        await expect(assertCredentialLaunch('github', 'SENTINEL_GITHUB_A')).rejects.toThrow();
        expect(fetch).not.toHaveBeenCalled();
    });
});

test('A02 raw sparse arrays reject before stringify or clone', () => {
    const sparse = new Array(100);
    expect(() => prepareImport({ extension: sparse }, { limits: { entries: 2 } })).toThrow(
        'entries'
    );
    expect(() => prepareImport({ extension: new Array(2) })).toThrow('non-json');
    expect(() => prepareImport({ extension: [null, null] })).not.toThrow();
});

test.each([0, 1, 2])(
    'B02 asynchronous failure at write %i aborts every queued write',
    async (position) => {
        const db = await seed();
        const before = await readManagedGame(db);
        await expect(
            strictTransaction(db, ['state'], 'readwrite', (tx: any) => {
                const store = tx.objectStore('state');
                for (let index = 0; index < 3; index++) {
                    if (index === position) store.add({ synthetic: true }, 'root');
                    else store.put({ synthetic: index }, `synthetic-${index}`);
                }
            })
        ).rejects.toThrow();
        expect(await readManagedGame(db)).toEqual(before);
        const rows = await strictTransaction(
            db,
            ['state'],
            'readonly',
            (tx: any, req: any, done: any) => req(tx.objectStore('state').getAllKeys(), done)
        );
        expect(rows).toEqual(['root']);
        db.close();
    }
);

test.each([2, 3, 4])(
    'C03 interruption at transaction boundary %i retains durable intent',
    async (boundary) => {
        const db = await seed();
        const transaction = db.transaction.bind(db);
        let calls = 0;
        const fault = vi.spyOn(db, 'transaction').mockImplementation((...args: any[]) => {
            if (++calls === boundary) throw new Error('synthetic interruption');
            return transaction(...args);
        });
        expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
            'incomplete'
        );
        fault.mockRestore();
        expect(credentialAuthority((await readManagedGame(db)).meta).github.pending).toBe(true);
        await expect(assertCredentialLaunch('github', 'SENTINEL_GITHUB_A')).rejects.toThrow();
        expect((await clearManagedCredential(db, 'github', stamp, lightweight)).status).toBe(
            'complete'
        );
        db.close();
    }
);

test('A02 aggregate raw JSON bytes reject before serialization with escaped UTF-8 accounting', () => {
    const raw = { a: '�', b: '\n', c: 'synthetic' };
    const size = new TextEncoder().encode(JSON.stringify(raw)).length;
    expect(() => prepareImport(raw, { limits: { jsonBytes: size - 1 } })).toThrow('json-bytes');
    expect(() => prepareImport(raw, { limits: { jsonBytes: size } })).not.toThrow();
    const stringify = vi.spyOn(JSON, 'stringify');
    expect(() =>
        prepareImport({ a: 'abcdef', b: 'abcdef' }, { limits: { jsonBytes: 15 } })
    ).toThrow('json-bytes');
    expect(stringify).not.toHaveBeenCalled();
    stringify.mockRestore();
});

test('A04 dialogue goto and start normalize together with node IDs', () => {
    const input = {
        schemaVersion: 1,
        quests: [
            {
                id: 'q',
                start: ' start ',
                dialogue: [
                    { id: ' start ', options: [{ text: 'Continue', goto: ' target ' }] },
                    { id: ' target ', options: [{ text: 'Finish', goto: 'finish' }] },
                ],
            },
        ],
    };
    const plan = prepareImport(input, { kind: 'custom' });
    expect(plan.customContent.quests[0].start).toBe('start');
    expect(plan.customContent.quests[0].dialogue[0].options[0].goto).toBe('target');
    input.quests[0].dialogue[0].options[0].goto = 'missing';
    expect(() => prepareImport(input, { kind: 'custom' })).toThrow('unresolved-reference');
});

test('B05 blocked normal schema setup releases the managed lock and cancels its late upgrade', async () => {
    const old = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('CustomContent', 2);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    const { initializeCustomContentForImportUI } = await import('../src/utils/indexeddb.js');
    await expect(initializeCustomContentForImportUI()).rejects.toThrow('blocked');
    await expect(serializeManagedMutation(() => 'available')).resolves.toBe('available');
    old.close();
    const after = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('CustomContent');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    expect(after.version).toBe(2);
    after.close();
});

test('A02 long nested property names never become regex-scanned validation paths', () => {
    const key = 'synthetic-long-key-'.repeat(1000);
    let nested: any = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`leaf${i}`, 'data:synthetic'])
    );
    for (let depth = 0; depth < 30; depth++) nested = { [key]: nested };
    const original = RegExp.prototype.test;
    const scanned: number[] = [];
    const spy = vi.spyOn(RegExp.prototype, 'test').mockImplementation(function (
        this: RegExp,
        value: string
    ) {
        if (String(value).includes(key)) scanned.push(String(value).length);
        return original.call(this, value);
    });
    try {
        expect(() => prepareImport({ extension: nested })).not.toThrow();
        expect(scanned.every((length) => length <= key.length)).toBe(true);
    } finally {
        spy.mockRestore();
    }
    expect(() =>
        prepareImport(
            { extension: { images: [{ dataUrl: 'data:' + 'x'.repeat(100) }] } },
            { limits: { stringBytes: 32 } }
        )
    ).toThrow('string-bytes');
    expect(() =>
        prepareImport(
            {
                schemaVersion: 1,
                items: [{ id: 'a' }],
                images: [
                    { id: 'synthetic-raster', entityType: 'item', entityId: 'a', dataUrl: png },
                ],
            },
            { kind: 'custom', limits: { stringBytes: 32 } }
        )
    ).not.toThrow();
});

test.each(['root', 'nested', 'array'])(
    'A02 rejects hidden serialization hooks without invoking them (%s)',
    (location) => {
        const hook = vi.fn(() => {
            throw new Error('must not run');
        });
        const target = location === 'array' ? [] : {};
        Object.defineProperty(target, 'toJSON', { value: hook, enumerable: false });
        const raw = location === 'root' ? target : { extension: target };
        expect(() => prepareImport(raw)).toThrow('non-json');
        expect(hook).not.toHaveBeenCalled();
        const getter = vi.fn(() => 'secret');
        const accessor = Object.defineProperty({}, 'hidden', { get: getter, enumerable: false });
        expect(() => prepareImport(accessor)).toThrow('non-json');
        expect(getter).not.toHaveBeenCalled();
    }
);

test('A04 quest rewards normalize known item references and finite nonnegative counts', () => {
    const plan = prepareImport(
        {
            schemaVersion: 1,
            items: [{ id: 700001, name: 'Synthetic reward' }],
            quests: [{ id: 'reward-quest', rewards: [{ id: 700001, count: 2 }] }],
        },
        { kind: 'custom' }
    );
    expect(plan.customContent.quests[0].rewards).toEqual([{ id: '700001', count: 2 }]);
});

test.each(['outlet-dWatt-1e3', 700002])(
    'A04 dialogue process references accept and normalize known process %s',
    (process) => {
        const plan = prepareImport(
            {
                schemaVersion: 1,
                processes: [{ id: 700002, title: 'Synthetic process' }],
                quests: [
                    {
                        id: 'process-quest',
                        dialogue: [
                            {
                                id: 'start',
                                options: [{ type: 'process', text: 'Synthetic', process }],
                            },
                        ],
                    },
                ],
            },
            { kind: 'custom' }
        );
        expect(plan.customContent.quests[0].dialogue[0].options[0].process).toBe(String(process));
    }
);

const containerImport = () => ({
    schemaVersion: 1,
    items: [
        { id: 710001, name: 'Synthetic content' },
        { id: 710002, name: 'Synthetic container', itemCounts: { '710001': 0 } },
    ],
});
test.each(['missing-container', null, {}, 710001])(
    'A04 rejects invalid/incompatible counted container reference %j',
    (containerItemId) => {
        expect(() =>
            prepareImport(
                {
                    ...containerImport(),
                    quests: [
                        {
                            id: 'container-quest',
                            requiresItems: [{ id: 710001, count: 1, containerItemId }],
                        },
                    ],
                },
                { kind: 'custom' }
            )
        ).toThrow();
    }
);
test('A04 normalizes a compatible counted container reference', () => {
    const plan = prepareImport(
        {
            ...containerImport(),
            quests: [
                {
                    id: 'container-quest',
                    requiresItems: [{ id: 710001, count: 1, containerItemId: 710002 }],
                },
            ],
        },
        { kind: 'custom' }
    );
    expect(plan.customContent.quests[0].requiresItems[0]).toEqual({
        id: '710001',
        count: 1,
        containerItemId: '710002',
    });
});
test.each([
    { operation: 'unknown', count: 1 },
    { operation: 'deposit', count: '1' },
    { operation: 'deposit', count: -1 },
    { operation: 'withdraw', count: 0 },
    { operation: 'withdraw' },
    { operation: 'withdraw-all', count: 1 },
    { operation: 'deposit', count: 1, itemId: 'unknown' },
    { operation: 'deposit', count: 1, containerItemId: 'unknown' },
    { operation: 'deposit', count: 1, containerItemId: 710001 },
])('A04 rejects malformed item-count operations %j', (fields) => {
    expect(() =>
        prepareImport(
            {
                ...containerImport(),
                processes: [
                    {
                        id: 'container-process',
                        itemCountOperations: [
                            { itemId: 710001, containerItemId: 710002, ...fields },
                        ],
                    },
                ],
            },
            { kind: 'custom' }
        )
    ).toThrow();
});
test.each(['deposit', 'withdraw', 'withdraw-all'])(
    'A04 normalizes supported item-count operation %s',
    (operation) => {
        const plan = prepareImport(
            {
                ...containerImport(),
                processes: [
                    {
                        id: 'container-process',
                        itemCountOperations: [
                            {
                                itemId: 710001,
                                containerItemId: 710002,
                                operation,
                                ...(operation === 'withdraw-all' ? {} : { count: 2 }),
                            },
                        ],
                    },
                ],
            },
            { kind: 'custom' }
        );
        expect(plan.customContent.processes[0].itemCountOperations[0]).toEqual({
            itemId: '710001',
            containerItemId: '710002',
            operation,
            ...(operation === 'withdraw-all' ? {} : { count: 2 }),
        });
    }
);

test.each([' __proto__ ', ' constructor ', ' prototype '])(
    'A04 rejects reserved IDs after normalization %s',
    (id) => {
        expect(() =>
            prepareImport({ schemaVersion: 1, items: [{ id }] }, { kind: 'custom' })
        ).toThrow('id');
    }
);
