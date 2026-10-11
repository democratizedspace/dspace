import { isBrowser } from './ssr.js';

export class StorageOperationError extends Error {
    constructor(code, committed = []) {
        super(
            code === 'partial'
                ? `Restore partially completed (${committed.join(', ')} committed). Custom content was not committed.`
                : code === 'mirror-incomplete'
                  ? `Restore mirrors incomplete (${committed.join(', ')} committed).`
                  : code
        );
        this.name = 'StorageOperationError';
        this.code = code;
        this.committed = Object.freeze([...committed]);
    }
}
const error = (code) => new StorageOperationError(code);
let queue = Promise.resolve();
export function serializeManagedMutation(operation) {
    const run = () => {
        if (!isBrowser || !globalThis.navigator?.locks?.request)
            throw error('storage-lock-unavailable');
        return navigator.locks.request('dspace-managed-storage-v1', operation);
    };
    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
}
export const flushManagedMutations = () => queue;
export function openExistingDatabase(name, stores) {
    return new Promise((resolve, reject) => {
        if (!globalThis.indexedDB) {
            reject(error('storage-unavailable'));
            return;
        }
        let request,
            settled = false;
        const fail = () => {
            settled = true;
            reject(error('storage-unavailable'));
        };
        try {
            request = indexedDB.open(name);
        } catch {
            fail();
            return;
        }
        request.onupgradeneeded = () => {
            request.transaction.abort();
            fail();
        };
        request.onblocked = fail;
        request.onerror = fail;
        request.onsuccess = () => {
            const db = request.result;
            if (settled || stores.some((s) => !db.objectStoreNames.contains(s))) {
                db.close();
                fail();
                return;
            }
            db.onversionchange = () => db.close();
            resolve(db);
        };
    });
}
export function strictTransaction(db, stores, mode, runner) {
    return new Promise((resolve, reject) => {
        let tx, result, failure;
        try {
            tx = db.transaction(stores, mode);
        } catch {
            reject(error('transaction-unavailable'));
            return;
        }
        const abort = (code = 'transaction-failed') => {
            failure ??= error(code);
            try {
                tx.abort();
            } catch {
                reject(failure);
            }
        };
        tx.oncomplete = () => (failure ? reject(failure) : resolve(result));
        tx.onerror = () => abort();
        tx.onabort = () => reject(failure || error('transaction-aborted'));
        const request = (req, callback) => {
            req.onerror = () => abort();
            req.onsuccess = () => {
                try {
                    callback(req.result);
                } catch {
                    abort();
                }
            };
        };
        try {
            runner(
                tx,
                request,
                (value) => {
                    result = value;
                },
                abort
            );
        } catch {
            abort();
        }
    });
}
const gameStores = ['state', 'backup', 'meta'];
export const openManagedGameDB = () => openExistingDatabase('dspaceGameState', gameStores);
export const readManagedGame = (db) =>
    strictTransaction(db, gameStores, 'readonly', (tx, req, done) => {
        const values = {};
        let count = 0;
        for (const name of gameStores)
            req(tx.objectStore(name).get('root'), (v) => {
                values[name] = v;
                if (++count === 3) done(values);
            });
    });
export function credentialAuthority(meta) {
    const source = meta?.credentialEpochs;
    const value = {
        github: { epoch: 0, pending: false, cleared: false },
        openAI: { epoch: 0, pending: false, cleared: false },
    };
    if (source === undefined) return value;
    for (const kind of ['github', 'openAI']) {
        const v = source[kind];
        if (
            !v ||
            !Number.isSafeInteger(v.epoch) ||
            v.epoch < 0 ||
            typeof v.pending !== 'boolean' ||
            typeof v.cleared !== 'boolean'
        )
            throw error('credential-authority-invalid');
        value[kind] = { epoch: v.epoch, pending: v.pending, cleared: v.cleared };
    }
    return value;
}
export function scrubCredential(value, kind) {
    const next = structuredClone(value);
    if (!next || typeof next !== 'object' || Array.isArray(next))
        throw error('owned-copy-malformed');
    const stack = [next],
        seen = new Set();
    while (stack.length) {
        const state = stack.pop();
        if (seen.has(state)) throw error('owned-copy-malformed');
        seen.add(state);
        if (
            kind in state &&
            (!state[kind] || typeof state[kind] !== 'object' || Array.isArray(state[kind]))
        )
            throw error('owned-copy-malformed');
        if (state[kind] && typeof state[kind] === 'object')
            delete state[kind][kind === 'github' ? 'token' : 'apiKey'];
        for (const wrapper of ['gameState', 'payload']) {
            if (wrapper in state) {
                if (
                    !state[wrapper] ||
                    typeof state[wrapper] !== 'object' ||
                    Array.isArray(state[wrapper])
                )
                    throw error('owned-copy-malformed');
                stack.push(state[wrapper]);
            }
        }
    }
    return next;
}
export function applyCredentialAuthority(value, authority) {
    let next = structuredClone(value);
    for (const kind of ['github', 'openAI'])
        if (authority[kind].pending || authority[kind].cleared) next = scrubCredential(next, kind);
    return next;
}
export async function assertCredentialLaunch(kind, candidate) {
    const db = await openManagedGameDB();
    try {
        const snapshot = await readManagedGame(db),
            authority = credentialAuthority(snapshot.meta);
        const actual = snapshot.state?.[kind]?.[kind === 'github' ? 'token' : 'apiKey'];
        if (
            !candidate ||
            authority[kind].pending ||
            authority[kind].cleared ||
            actual !== candidate
        )
            throw error('credential-unavailable');
        return candidate;
    } finally {
        db.close();
    }
}
export function commitManagedGame(
    db,
    { next, backup, expectedChecksum, expectedEpochs, stamp, lightweight, deliberateKind }
) {
    return strictTransaction(db, gameStores, 'readwrite', (tx, req, done, abort) => {
        req(tx.objectStore('meta').get('root'), (oldMeta) => {
            const authority = credentialAuthority(oldMeta);
            for (const kind of ['github', 'openAI']) {
                if (expectedEpochs && expectedEpochs[kind].epoch !== authority[kind].epoch) {
                    abort('stale-credential-epoch');
                    return;
                }
                if (authority[kind].pending) {
                    abort('clear-incomplete');
                    return;
                }
            }
            req(tx.objectStore('state').get('root'), (previous) => {
                if (
                    expectedChecksum !== undefined &&
                    (previous?._meta?.checksum ?? null) !== expectedChecksum
                ) {
                    abort('stale-state');
                    return;
                }
                if (deliberateKind)
                    authority[deliberateKind] = {
                        epoch: authority[deliberateKind].epoch + 1,
                        pending: false,
                        cleared: false,
                    };
                const target = structuredClone(next);
                for (const kind of ['github', 'openAI']) {
                    if (kind === deliberateKind) continue;
                    delete target[kind];
                    if (previous?.[kind]) target[kind] = structuredClone(previous[kind]);
                }
                const safeNext = applyCredentialAuthority(target, authority);
                const safeBackup =
                    backup === undefined ? undefined : applyCredentialAuthority(backup, authority);
                stamp(safeNext);
                if (safeBackup !== undefined) stamp(safeBackup);
                tx.objectStore('state').put(safeNext, 'root');
                if (safeBackup === undefined) tx.objectStore('backup').delete('root');
                else tx.objectStore('backup').put(safeBackup, 'root');
                const nextMeta = {
                    ...oldMeta,
                    ...lightweight(safeNext),
                    credentialEpochs: authority,
                };
                tx.objectStore('meta').put(nextMeta, 'root');
                done({ state: safeNext, backup: safeBackup, meta: nextMeta });
            });
        });
    });
}
export function mirrorManagedGame(snapshot) {
    if (snapshot.backup === undefined) localStorage.removeItem('gameStateBackup');
    else localStorage.setItem('gameStateBackup', JSON.stringify(snapshot.backup));
    localStorage.setItem('gameState', JSON.stringify(snapshot.state));
    localStorage.setItem('gameStateLite', JSON.stringify(snapshot.meta));
    localStorage.setItem('gameStateChecksum', snapshot.state?._meta?.checksum || '');
}
export async function clearManagedCredential(db, kind, stamp, lightweight) {
    if (!['github', 'openAI'].includes(kind)) throw error('credential-kind');
    try {
        await strictTransaction(db, ['meta'], 'readwrite', (tx, req) => {
            req(tx.objectStore('meta').get('root'), (old) => {
                const authority = credentialAuthority(old);
                authority[kind] = {
                    epoch: authority[kind].epoch + 1,
                    pending: true,
                    cleared: true,
                };
                tx.objectStore('meta').put({ ...old, credentialEpochs: authority }, 'root');
            });
        });
    } catch {
        return { status: 'not-started', committed: [] };
    }
    try {
        const local = {};
        for (const key of ['gameState', 'gameStateBackup']) {
            const text = localStorage.getItem(key);
            if (text !== null) {
                local[key] = scrubCredential(JSON.parse(text), kind);
                stamp(local[key]);
            }
        }
        const snapshot = await strictTransaction(db, gameStores, 'readwrite', (tx, req, done) => {
            const values = {};
            let count = 0;
            for (const name of gameStores)
                req(tx.objectStore(name).get('root'), (v) => {
                    values[name] = v;
                    if (++count !== 3) return;
                    for (const name of ['state', 'backup']) {
                        if (values[name] !== undefined) {
                            values[name] = scrubCredential(values[name], kind);
                            stamp(values[name]);
                            tx.objectStore(name).put(values[name], 'root');
                        }
                    }
                    values.meta = {
                        ...scrubCredential(values.meta || {}, kind),
                        ...lightweight(values.state),
                        credentialEpochs: credentialAuthority(values.meta),
                    };
                    tx.objectStore('meta').put(values.meta, 'root');
                    done(values);
                });
        });
        for (const [key, value] of Object.entries(local))
            localStorage.setItem(key, JSON.stringify(value));
        const localMeta = {
            ...lightweight(local.gameState || snapshot.state),
            credentialEpochs: credentialAuthority(snapshot.meta),
        };
        localStorage.setItem('gameStateLite', JSON.stringify(localMeta));
        localStorage.setItem('gameStateChecksum', localMeta.checksum || '');
        for (const [key, value] of Object.entries(local))
            if (localStorage.getItem(key) !== JSON.stringify(value)) throw error('clear-readback');
        if (
            localStorage.getItem('gameStateLite') !== JSON.stringify(localMeta) ||
            localStorage.getItem('gameStateChecksum') !== (localMeta.checksum || '')
        )
            throw error('clear-readback');
        const verified = await readManagedGame(db);
        for (const name of ['state', 'backup'])
            if (JSON.stringify(verified[name]) !== JSON.stringify(snapshot[name]))
                throw error('clear-readback');
        await strictTransaction(db, ['meta'], 'readwrite', (tx, req) => {
            req(tx.objectStore('meta').get('root'), (meta) => {
                const authority = credentialAuthority(meta);
                authority[kind].pending = false;
                tx.objectStore('meta').put({ ...meta, credentialEpochs: authority }, 'root');
            });
        });
        return { status: 'complete', committed: ['game', 'mirrors'], snapshot: verified };
    } catch {
        return { status: 'incomplete', committed: ['clear-intent'] };
    }
}

export async function preflightCustomImport() {
    const db = await openExistingDatabase('CustomContent', [
        'meta',
        'items',
        'processes',
        'quests',
    ]);
    try {
        const snapshot = await strictTransaction(
            db,
            ['meta', 'items', 'processes', 'quests'],
            'readonly',
            (tx, req, done, abort) => {
                const result = {};
                let count = 0;
                req(tx.objectStore('meta').get('schemaVersion'), (version) => {
                    if (version !== 3) abort('migration-required');
                });
                req(tx.objectStore('meta').get('contentRevision'), (revision) => {
                    result.revision = revision || 0;
                });
                for (const name of ['items', 'processes', 'quests'])
                    req(tx.objectStore(name).getAll(), (records) => {
                        result[name] = records;
                        if (++count === 3) done(result);
                    });
            }
        );
        return { db, snapshot };
    } catch (e) {
        db.close();
        throw e;
    }
}
export function commitCustomImport(db, content, expected, overwriteExisting) {
    return strictTransaction(
        db,
        ['items', 'processes', 'quests', 'meta'],
        'readwrite',
        (tx, req, done, abort) => {
            let count = 0;
            req(tx.objectStore('meta').get('contentRevision'), (revision) => {
                if ((revision || 0) !== (expected.revision || 0)) abort('stale-custom-content');
                else tx.objectStore('meta').put((revision || 0) + 1, 'contentRevision');
            });
            for (const name of ['items', 'processes', 'quests'])
                req(tx.objectStore(name).getAll(), (records) => {
                    if (JSON.stringify(records) !== JSON.stringify(expected[name])) {
                        abort('stale-custom-content');
                        return;
                    }
                    if (++count !== 3) return;
                    for (const section of ['items', 'processes', 'quests']) {
                        const store = tx.objectStore(section);
                        for (const entity of content[section]) {
                            const write = overwriteExisting
                                ? store.put(structuredClone(entity))
                                : store.add(structuredClone(entity));
                            write.onerror = () => abort('custom-conflict');
                        }
                    }
                    done({ status: 'complete', committed: ['custom'] });
                });
        }
    );
}
