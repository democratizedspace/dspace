import { writable } from 'svelte/store';
import { sanitizeSaveForBackup } from '../../lib/cloudsync/githubGists';
import { normalizeSettings, DEFAULT_SETTINGS } from '../settingsDefaults.js';
import { isBrowser } from '../ssr.js';
import { readLegacyV2LocalStorage } from '../legacySaveParsing.js';
import {
    serializeManagedMutation,
    strictTransaction,
    flushManagedMutations,
    openManagedGameDB,
    openExistingDatabase,
    readManagedGame,
    credentialAuthority,
    applyCredentialAuthority,
    scrubCredential,
    commitManagedGame,
    mirrorManagedGame,
    clearManagedCredential,
    preflightCustomImport,
    commitCustomImport,
    StorageOperationError,
    assertCredentialLaunch,
} from '../managedImportStorage.js';
export { assertCredentialLaunch };
let knownEpochs = credentialAuthority();
let recovery = null;
let durableChecksum = null;
let pendingGameWrites = 0;
const pendingCredentialSaves = new Set();
let latestPendingGameSave = null;
let managedCommitOrder = 0;
const ownedSnapshots = new WeakMap();
const snapshotClearGenerations = new WeakMap();
const snapshotGameplayBases = new WeakMap();
let clearGeneration = 0;
let credentialNotices;
import { LEGACY_QUEST_ID_ALIASES } from '../questIdAliases.js';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 2;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const META_STORE = 'meta';
const ROOT_KEY = 'root';
export const LS_STATE_KEY = 'gameState';
const LS_BACKUP_KEY = 'gameStateBackup';
const LS_CHECKSUM_KEY = 'gameStateChecksum';
const LS_LIGHTWEIGHT_KEY = 'gameStateLite';
const META_KEY = '_meta';
const BACKUP_SCHEMA_VERSION = 1;
const LOCAL_EXPORT_PROVIDER = 'local-export';
const isDev = Boolean(import.meta?.env?.DEV);
const CURRENT_VERSION = '3';
const QUEST_LIST_SNAPSHOT_VERSION = 1;

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const rewriteLegacyClaimKey = (claimKey, legacyId, canonicalId) => {
    if (typeof claimKey !== 'string') {
        return claimKey;
    }

    const legacyPrefix = `${legacyId}-`;
    if (!claimKey.startsWith(legacyPrefix)) {
        return claimKey;
    }

    return `${canonicalId}-${claimKey.slice(legacyPrefix.length)}`;
};

const logPersistenceIssue = (message, error) => {
    const details = error?.message ?? error;

    if (isDev) {
        console.error(message, details);
        return;
    }

    console.warn(message, details);
};

let dbPromise;
let dbInstance;
let useLocalStorage = false;
let warnedFallback = false;
let readyResolved = false;
let loadedFromPersistence = false;
const hasValidChatProvider = (state) =>
    state?.settings?.chatProvider === 'token-place' || state?.settings?.chatProvider === 'openai';
const canonicalizeChatProviderProvenance = (state) => {
    if (!state || typeof state !== 'object') return state;
    ensureMeta(state);
    const marker = state[META_KEY].chatProviderExplicit;
    // A markerless legacy save with a valid raw provider represents an intentional choice.
    state[META_KEY].chatProviderExplicit =
        hasValidChatProvider(state) && (marker === true || marker === undefined);
    return state;
};
export const isUsingLocalStorage = () => useLocalStorage;
export const hasPersistedGameState = () => loadedFromPersistence;
export const hasExplicitChatProvider = (state) =>
    hasValidChatProvider(state) && state?.[META_KEY]?.chatProviderExplicit === true;

function warnFallback() {
    if (warnedFallback) return;
    warnedFallback = true;
    const message =
        'IndexedDB is unavailable; falling back to localStorage. Storage may be limited.';
    if (isBrowser && typeof window.alert === 'function') {
        window.alert(message);
    } else {
        console.warn(message);
    }
}

function openDB() {
    if (!isBrowser || !('indexedDB' in globalThis)) {
        return Promise.reject(new Error('IndexedDB not supported'));
    }
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STATE_STORE)) {
                    db.createObjectStore(STATE_STORE);
                }
                if (!db.objectStoreNames.contains(BACKUP_STORE)) {
                    db.createObjectStore(BACKUP_STORE);
                }
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE);
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                dbInstance = db;
                db.onclose = () => {
                    if (dbInstance === db) {
                        dbInstance = undefined;
                        dbPromise = undefined;
                    }
                };
                db.onversionchange = () => {
                    try {
                        db.close();
                    } catch (err) {
                        console.warn('Error closing game state database on version change:', err);
                    }
                };
                resolve(db);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('storage-blocked'));
        });
    }
    return dbPromise;
}

function idbRead(store) {
    return openDB().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(store, 'readonly');
                const req = tx.objectStore(store).get(ROOT_KEY);
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e.target.error);
            })
    );
}

function lsKey(store) {
    if (store === STATE_STORE) return LS_STATE_KEY;
    if (store === BACKUP_STORE) return LS_BACKUP_KEY;
    return LS_LIGHTWEIGHT_KEY;
}

function lsRead(store) {
    if (!isBrowser) return undefined;
    try {
        const raw = localStorage.getItem(lsKey(store));
        return raw ? JSON.parse(raw) : undefined;
    } catch (err) {
        logPersistenceIssue('Error reading from localStorage:', err);
        return undefined;
    }
}

function lsWrite(store, value) {
    if (!isBrowser) return;
    try {
        localStorage.setItem(lsKey(store), JSON.stringify(value));
    } catch (err) {
        logPersistenceIssue('Error writing to localStorage:', err);
    }
}

function readLegacyChecksumMarker() {
    if (!isBrowser) return '';
    try {
        const localChecksum = localStorage.getItem(LS_CHECKSUM_KEY);
        return typeof localChecksum === 'string' ? localChecksum : '';
    } catch (err) {
        logPersistenceIssue('Error reading checksum from localStorage:', err);
        return '';
    }
}

function readChecksumMarker() {
    const lightweight = readLightweightSnapshotFromLocalStorage();
    return lightweight.checksum;
}

function writeChecksumMarker(checksum) {
    if (!isBrowser || typeof checksum !== 'string' || !checksum) return;
    try {
        localStorage.setItem(LS_CHECKSUM_KEY, checksum);
    } catch (err) {
        logPersistenceIssue('Error writing checksum to localStorage:', err);
    }
}

const getPersistedDusd = (state) => {
    if (
        !state ||
        typeof state !== 'object' ||
        !state.inventory ||
        typeof state.inventory !== 'object'
    ) {
        return 0;
    }

    for (const [itemId, count] of Object.entries(state.inventory)) {
        if (itemId === '5247a603-294a-4a34-a884-1ae20969b2a1') {
            return Number.isFinite(count) ? Number(count) : 0;
        }
    }

    return 0;
};

const getCompletedQuestIds = (state) => {
    if (!state?.quests || typeof state.quests !== 'object') {
        return [];
    }

    return Object.entries(state.quests)
        .filter(([, progress]) => Boolean(progress?.finished))
        .map(([questId]) => questId)
        .sort((a, b) => a.localeCompare(b));
};

const buildLightweightSnapshot = (state) => ({
    checksum: state?.[META_KEY]?.checksum ?? '',
    dUSD: getPersistedDusd(state),
    lastUpdated: state?.[META_KEY]?.lastUpdated ?? Date.now(),
    questProgress: {
        version: QUEST_LIST_SNAPSHOT_VERSION,
        completedQuestIds: getCompletedQuestIds(state),
    },
});

const normalizeLightweightSnapshot = (value) => {
    if (!value || typeof value !== 'object') {
        return {
            checksum: '',
            dUSD: 0,
            lastUpdated: 0,
            questProgress: { version: 0, completedQuestIds: [] },
        };
    }

    const normalizedQuestProgress = value.questProgress;
    const snapshotVersion = Number.isFinite(normalizedQuestProgress?.version)
        ? Number(normalizedQuestProgress.version)
        : 0;

    return {
        checksum: typeof value.checksum === 'string' ? value.checksum : '',
        dUSD: Number.isFinite(value.dUSD) ? Number(value.dUSD) : 0,
        lastUpdated: Number.isFinite(value.lastUpdated) ? Number(value.lastUpdated) : 0,
        questProgress: {
            version: snapshotVersion,
            completedQuestIds: Array.isArray(normalizedQuestProgress?.completedQuestIds)
                ? normalizedQuestProgress.completedQuestIds
                      .filter((questId) => typeof questId === 'string' && questId.trim())
                      .map((questId) => questId.trim())
                : [],
        },
    };
};

const readLightweightSnapshotFromLocalStorage = () => {
    const snapshot = normalizeLightweightSnapshot(lsRead(META_STORE));
    if (snapshot.checksum) {
        return snapshot;
    }

    return {
        ...snapshot,
        checksum: readLegacyChecksumMarker(),
    };
};

async function read(store) {
    // On server, return undefined - storage is client-only
    if (!isBrowser) return undefined;
    const localValue = lsRead(store);
    if (useLocalStorage) return localValue;
    try {
        const idbValue = await idbRead(store);
        if (store === STATE_STORE) {
            const idbUpdated = idbValue?.[META_KEY]?.lastUpdated ?? 0;
            const localUpdated = localValue?.[META_KEY]?.lastUpdated ?? 0;
            if (localUpdated > idbUpdated) {
                return localValue ?? idbValue;
            }
        }
        return idbValue ?? localValue;
    } catch (err) {
        logPersistenceIssue('IndexedDB read failed:', err);
        useLocalStorage = true;
        warnFallback();
        return localValue;
    }
}

const initializeGameState = () => ({
    quests: {},
    inventory: {},
    processes: {},
    itemContainerCounts: {},
    settings: { ...DEFAULT_SETTINGS },
    versionNumberString: CURRENT_VERSION,
    [META_KEY]: { lastUpdated: Date.now(), chatProviderExplicit: false },
});

const ensureMeta = (state) => {
    const meta = state[META_KEY];
    if (!meta || typeof meta !== 'object') {
        state[META_KEY] = { lastUpdated: Date.now() };
        return;
    }

    if (typeof meta.lastUpdated !== 'number' || Number.isNaN(meta.lastUpdated)) {
        meta.lastUpdated = Date.now();
    }

    if (typeof meta.checksum !== 'string' || !meta.checksum.trim()) {
        meta.checksum = '';
    }
};

const sortForChecksum = (value) => {
    if (Array.isArray(value)) {
        return value.map(sortForChecksum);
    }

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
                acc[key] = sortForChecksum(value[key]);
                return acc;
            }, {});
    }

    return value;
};

const checksumInput = (state) => {
    const next = structuredClone(state);
    if (next?.[META_KEY] && typeof next[META_KEY] === 'object') {
        delete next[META_KEY].lastUpdated;
        delete next[META_KEY].checksum;
    }
    return JSON.stringify(sortForChecksum(next));
};

const computeChecksum = (state) => {
    const input = checksumInput(state);
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        // Lightweight non-cryptographic mixing step inspired by FNV; this is not strict FNV-1a.
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
};

const gameplayChecksum = (value) => {
    const next = scrubCredential(scrubCredential(value, 'github'), 'openAI');
    const stack = [next];
    while (stack.length) {
        const record = stack.pop();
        for (const kind of ['github', 'openAI']) {
            if (record[kind] && Object.keys(record[kind]).length === 0) delete record[kind];
        }
        if (record._meta) {
            delete record._meta.checksum;
            delete record._meta.lastUpdated;
        }
        for (const key of ['gameState', 'payload']) if (record[key]) stack.push(record[key]);
    }
    return computeChecksum(next);
};

const stampStateChecksum = (state) => {
    ensureMeta(state);
    state[META_KEY].checksum = computeChecksum(state);
};

export const validateGameState = (state) => {
    if (!state || typeof state !== 'object') {
        return initializeGameState();
    }
    canonicalizeChatProviderProvenance(state);
    if (!isPlainObject(state.quests)) {
        state.quests = {};
    }
    for (const [legacyId, canonicalId] of Object.entries(LEGACY_QUEST_ID_ALIASES)) {
        const legacyProgress = state.quests[legacyId];
        if (!isPlainObject(legacyProgress)) {
            continue;
        }

        const canonicalSource = state.quests[canonicalId];
        const canonicalProgress = isPlainObject(canonicalSource) ? canonicalSource : {};
        const rewrittenLegacyClaims = Array.isArray(legacyProgress.itemsClaimed)
            ? legacyProgress.itemsClaimed.map((claimKey) =>
                  rewriteLegacyClaimKey(claimKey, legacyId, canonicalId)
              )
            : [];

        state.quests[canonicalId] = {
            ...legacyProgress,
            ...canonicalProgress,
            finished: Boolean(canonicalProgress.finished || legacyProgress.finished),
            itemsClaimed: [
                ...new Set([
                    ...rewrittenLegacyClaims,
                    ...(Array.isArray(canonicalProgress.itemsClaimed)
                        ? canonicalProgress.itemsClaimed
                        : []),
                ]),
            ],
        };

        delete state.quests[legacyId];
    }
    if (typeof state.inventory !== 'object' || state.inventory === null) {
        state.inventory = {};
    }
    if (typeof state.processes !== 'object' || state.processes === null) {
        state.processes = {};
    }
    if (typeof state.itemContainerCounts !== 'object' || state.itemContainerCounts === null) {
        state.itemContainerCounts = {};
    }
    state.settings = normalizeSettings(state.settings);
    if (typeof state.versionNumberString !== 'string' || !state.versionNumberString.trim()) {
        state.versionNumberString = CURRENT_VERSION;
    }
    ensureMeta(state);
    stampStateChecksum(state);
    return state;
};

let gameState = initializeGameState();
export const state = writable(gameState);
const loadCredentialFreeFallback = async () => {
    useLocalStorage = true;
    let stored = lsRead(STATE_STORE),
        db;
    try {
        // Read legacy/existing progress without migrations, metadata writes or credentials.
        db = await openExistingDatabase(DB_NAME, [STATE_STORE]);
        const persisted = await strictTransaction(
            db,
            [STATE_STORE],
            'readonly',
            (tx, req, done) => {
                req(tx.objectStore(STATE_STORE).get('root'), done);
            }
        );
        const updated = (value) =>
            Number.isFinite(value?.[META_KEY]?.lastUpdated) ? value[META_KEY].lastUpdated : 0;
        if (persisted && (!stored || updated(persisted) >= updated(stored))) stored = persisted;
    } catch {
        // Unavailable durable storage retains the existing localStorage-only fallback.
    } finally {
        db?.close();
    }

    if (stored) {
        gameState = validateGameState(scrubCredential(scrubCredential(stored, 'github'), 'openAI'));
        loadedFromPersistence = true;
        state.set(gameState);
    }
    logPersistenceIssue('Game state authority unavailable; credentials disabled.');
};

// Only execute in browser environment to avoid SSR issues with IndexedDB
export const ready = isBrowser
    ? serializeManagedMutation(async () => {
          try {
              const db = await openDB();
              const persisted = await readManagedGame(db);
              knownEpochs = credentialAuthority(persisted.meta);
              durableChecksum = persisted.state?._meta?.checksum ?? null;
              const stored = persisted.state ?? lsRead(STATE_STORE);
              if (stored) {
                  gameState = validateGameState(applyCredentialAuthority(stored, knownEpochs));
                  state.set(gameState);
                  loadedFromPersistence = true;
              }
              // Normal startup retains the lightweight snapshot contract without changing
              // state/backup or replacing durable credential authority.
              const lightweight = buildLightweightSnapshot(gameState);
              await strictTransaction(db, ['meta'], 'readwrite', (tx, req) => {
                  req(tx.objectStore('meta').get('root'), (meta) => {
                      tx.objectStore('meta').put(
                          { ...meta, ...lightweight, credentialEpochs: credentialAuthority(meta) },
                          'root'
                      );
                  });
              });
              localStorage.setItem(
                  LS_LIGHTWEIGHT_KEY,
                  JSON.stringify({ ...lightweight, credentialEpochs: knownEpochs })
              );
              writeChecksumMarker(gameState[META_KEY].checksum);
          } catch (err) {
              await loadCredentialFreeFallback();
          } finally {
              readyResolved = true;
          }
      }).catch(async () => {
          try {
              await loadCredentialFreeFallback();
          } finally {
              readyResolved = true;
          }
      })
    : Promise.resolve().then(() => {
          readyResolved = true;
      });

if (isBrowser && typeof window.BroadcastChannel === 'function') {
    const notices = new window.BroadcastChannel('dspace-credential-epochs-v1');
    credentialNotices = notices;
    notices.onmessage = ({ data }) => {
        if (!['github', 'openAI'].includes(data?.kind) || !Number.isSafeInteger(data?.epoch))
            return;
        if (data.epoch < knownEpochs[data.kind].epoch) return;
        const dependency = {
            kind: data.kind,
            before: structuredClone(knownEpochs),
            authority: null,
            promise: null,
            clearGeneration: ++clearGeneration,
            refresh: true,
            beforeGameplay: gameplayChecksum(gameState),
            gameplayChecksum: null,
        };
        pendingCredentialSaves.add(dependency);
        recovery = null;
        dependency.promise = serializeManagedMutation(async () => {
            const db = await openManagedGameDB();
            try {
                const persisted = await readManagedGame(db);
                const authority = credentialAuthority(persisted.meta);
                knownEpochs = authority;
                durableChecksum = persisted.state?._meta?.checksum ?? null;
                dependency.gameplayChecksum = gameplayChecksum(
                    persisted.state ?? initializeGameState()
                );
                dependency.authority = structuredClone(authority);
                dependency.checksum = durableChecksum;
                dependency.order = ++managedCommitOrder;
                if (persisted.state && pendingGameWrites === 0) {
                    gameState = validateGameState(
                        applyCredentialAuthority(persisted.state, authority)
                    );
                    state.set(gameState);
                }
                if (authority[data.kind].epoch === data.epoch) {
                    window.dispatchEvent(
                        new CustomEvent('dspace-credential-cleared', {
                            detail: { kind: data.kind },
                        })
                    );
                }
            } finally {
                db.close();
            }
        })
            .catch(() => {
                /* The scrubbed runtime remains fail-closed until authority is readable. */
            })
            .finally(() => pendingCredentialSaves.delete(dependency));
        // Reserve the refresh dependency before publishing so subscribers can save safely.
        gameState = scrubCredential(gameState, data.kind);
        stampStateChecksum(gameState);
        state.set(gameState);
    };
}
let writeQueue = Promise.resolve();

export const flushGameStateWritesForTesting = async () => {
    await writeQueue.catch(() => undefined);
    await flushManagedMutations();
};

if (isBrowser) {
    globalThis.__dspaceFlushGameStateWrites = flushGameStateWritesForTesting;
}

export const loadGameState = () => {
    const snapshot = structuredClone(gameState);
    ownedSnapshots.set(snapshot, structuredClone(knownEpochs));
    snapshotClearGenerations.set(snapshot, clearGeneration);
    snapshotGameplayBases.set(snapshot, gameState);
    return snapshot;
};

export const getGameStateChecksum = () => gameState?.[META_KEY]?.checksum ?? '';

export const isGameStateReady = () => readyResolved;
export const hasLoadedPersistedGameState = () => loadedFromPersistence;

export const saveGameState = async (newState, { deliberateKind } = {}) => {
    const captured = structuredClone(newState);
    if (isBrowser && !globalThis.navigator?.locks?.request && !deliberateKind) {
        if (!readyResolved) await ready;
        const safe = validateGameState(
            scrubCredential(scrubCredential(captured, 'github'), 'openAI')
        );
        const backup = scrubCredential(scrubCredential(gameState, 'github'), 'openAI');
        safe[META_KEY].lastUpdated = Math.max(
            Date.now(),
            (gameState[META_KEY]?.lastUpdated ?? 0) + 1
        );
        stampStateChecksum(safe);
        stampStateChecksum(backup);
        // This synchronous, game-only mirror fallback never opens or mutates IndexedDB.
        mirrorManagedGame({ state: safe, backup, meta: buildLightweightSnapshot(safe) });
        useLocalStorage = true;
        recovery = null;
        durableChecksum = safe._meta.checksum;
        gameState = safe;
        state.set(gameState);
        return { status: 'best-effort', committed: ['localStorage'], credentialsDisabled: true };
    }
    let capturedEpochs = ownedSnapshots.get(newState) ?? structuredClone(knownEpochs);
    const capturedClearGeneration = snapshotClearGenerations.get(newState) ?? clearGeneration;
    const capturedGameplayBase = snapshotGameplayBases.get(newState) ?? gameState;
    const credentialDependencies = [...pendingCredentialSaves];
    const predecessor = latestPendingGameSave;
    const queued = { promise: null, checksum: null, order: 0 };
    latestPendingGameSave = queued;
    pendingGameWrites++;
    try {
        const previousSnapshot = structuredClone(gameState);
        for (const kind of ['github', 'openAI']) {
            if (kind === deliberateKind) continue;
            delete captured[kind];
            if (gameState[kind]) captured[kind] = structuredClone(gameState[kind]);
        }
        const nextState = validateGameState(captured);
        nextState[META_KEY].lastUpdated = Date.now();
        stampStateChecksum(nextState);
        let expectedChecksum = durableChecksum;
        durableChecksum = nextState._meta.checksum;
        gameState = nextState;
        state.set(gameState);
        const result = serializeManagedMutation(async () => {
            await ready;
            for (const dependency of credentialDependencies) {
                await dependency.promise;
                if (
                    dependency.gameplayChecksum &&
                    dependency.beforeGameplay !== dependency.gameplayChecksum &&
                    gameplayChecksum(capturedGameplayBase) !== dependency.gameplayChecksum
                ) {
                    throw new StorageOperationError('stale-state');
                }
                const canAdvance =
                    dependency.authority &&
                    (!dependency.clearGeneration ||
                        capturedClearGeneration >= dependency.clearGeneration) &&
                    ['github', 'openAI'].every((kind) =>
                        dependency.refresh
                            ? dependency.authority[kind].epoch >= capturedEpochs[kind].epoch
                            : capturedEpochs[kind].epoch === dependency.before[kind].epoch &&
                              dependency.authority[kind].epoch ===
                                  dependency.before[kind].epoch + (kind === dependency.kind ? 1 : 0)
                    );
                if (canAdvance) capturedEpochs = structuredClone(dependency.authority);
            }
            if (predecessor) await predecessor.promise;
            const completed = [...credentialDependencies, ...(predecessor ? [predecessor] : [])]
                .filter((entry) => entry.order)
                .sort((a, b) => b.order - a.order)[0];
            if (completed) expectedChecksum = completed.checksum;
            let db;
            try {
                db = await openManagedGameDB();
            } catch (error) {
                if (deliberateKind) throw error;
                // Game-only fallback cannot authorize credentials without durable epochs.
                const safe = scrubCredential(scrubCredential(nextState, 'github'), 'openAI');
                const backup = scrubCredential(
                    scrubCredential(previousSnapshot, 'github'),
                    'openAI'
                );
                stampStateChecksum(safe);
                stampStateChecksum(backup);
                mirrorManagedGame({
                    state: safe,
                    backup,
                    meta: buildLightweightSnapshot(safe),
                });
                useLocalStorage = true;
                if (latestPendingGameSave === queued) {
                    gameState = safe;
                    durableChecksum = safe._meta.checksum;
                    state.set(gameState);
                }
                return {
                    status: 'best-effort',
                    committed: ['localStorage'],
                    credentialsDisabled: true,
                };
            }
            try {
                const receipt = await commitManagedGame(db, {
                    next: nextState,
                    backup: previousSnapshot,
                    expectedChecksum,
                    expectedEpochs: capturedEpochs,
                    deliberateKind,
                    stamp: stampStateChecksum,
                    lightweight: buildLightweightSnapshot,
                });
                recovery = null;
                knownEpochs = credentialAuthority(receipt.meta);
                queued.checksum = receipt.state._meta.checksum;
                queued.order = ++managedCommitOrder;
                durableChecksum = queued.checksum;
                try {
                    mirrorManagedGame(receipt);
                } catch {
                    throw new StorageOperationError('mirror-incomplete', ['game']);
                }
                // A later queued save already owns the newer UI snapshot.
                if (latestPendingGameSave === queued) {
                    durableChecksum = receipt.state?._meta?.checksum ?? null;
                    gameState = receipt.state;
                    state.set(gameState);
                }
                return { status: 'complete', committed: ['game', 'mirrors'] };
            } catch (error) {
                if (latestPendingGameSave === queued) {
                    const persisted = await readManagedGame(db);
                    knownEpochs = credentialAuthority(persisted.meta);
                    durableChecksum = persisted.state?._meta?.checksum ?? null;
                    if (persisted.state) {
                        gameState = validateGameState(
                            applyCredentialAuthority(persisted.state, knownEpochs)
                        );
                        state.set(gameState);
                    }
                }
                throw error;
            } finally {
                db.close();
            }
        }).catch(async (error) => {
            if (latestPendingGameSave === queued) {
                let db;
                try {
                    db = await openManagedGameDB();
                    const persisted = await readManagedGame(db);
                    if (latestPendingGameSave === queued) {
                        knownEpochs = credentialAuthority(persisted.meta);
                        durableChecksum = persisted.state?._meta?.checksum ?? null;
                        gameState = validateGameState(
                            applyCredentialAuthority(
                                persisted.state ?? initializeGameState(),
                                knownEpochs
                            )
                        );
                        state.set(gameState);
                    }
                } catch {
                    if (latestPendingGameSave === queued) {
                        gameState = scrubCredential(
                            scrubCredential(previousSnapshot, 'github'),
                            'openAI'
                        );
                        state.set(gameState);
                    }
                } finally {
                    db?.close();
                }
            }
            throw error;
        });
        queued.promise = result;
        writeQueue = result.catch(() => undefined);
        return await result;
    } finally {
        pendingGameWrites--;
        if (latestPendingGameSave === queued) latestPendingGameSave = null;
    }
};

export async function saveCredential(kind, value) {
    if (!['github', 'openAI'].includes(kind) || typeof value !== 'string' || !value.trim())
        throw new StorageOperationError('credential-value');
    const dependency = {
        kind,
        before: structuredClone(knownEpochs),
        beforeGameplay: gameplayChecksum(gameState),
        gameplayChecksum: null,
        authority: null,
        promise: null,
    };
    pendingCredentialSaves.add(dependency);
    dependency.promise = serializeManagedMutation(async () => {
        await ready;
        const observedUI = gameState;
        const db = await openManagedGameDB();
        try {
            const previous = await readManagedGame(db);
            dependency.before = credentialAuthority(previous.meta);
            const next = validateGameState(structuredClone(previous.state ?? gameState));
            next[kind] = { ...next[kind], [kind === 'github' ? 'token' : 'apiKey']: value };
            const receipt = await commitManagedGame(db, {
                next,
                backup: previous.state ?? gameState,
                expectedChecksum: previous.state?._meta?.checksum ?? null,
                expectedEpochs: credentialAuthority(previous.meta),
                deliberateKind: kind,
                stamp: stampStateChecksum,
                lightweight: buildLightweightSnapshot,
            });
            knownEpochs = credentialAuthority(receipt.meta);
            dependency.gameplayChecksum = gameplayChecksum(receipt.state);
            dependency.authority = structuredClone(knownEpochs);
            dependency.checksum = receipt.state._meta.checksum;
            dependency.order = ++managedCommitOrder;
            durableChecksum = dependency.checksum;
            if (gameState === observedUI && pendingGameWrites === 0) {
                gameState = receipt.state;
                durableChecksum = receipt.state._meta.checksum;
                state.set(gameState);
            }
            try {
                mirrorManagedGame(receipt);
            } catch {
                throw new StorageOperationError('mirror-incomplete', ['game']);
            }
            return { status: 'complete', committed: ['game', 'mirrors'] };
        } finally {
            db.close();
        }
    });
    try {
        return await dependency.promise;
    } finally {
        pendingCredentialSaves.delete(dependency);
    }
}
const stampOwnedState = (value) => {
    const stack = [value],
        records = [];
    while (stack.length) {
        const record = stack.pop();
        records.push(record);
        for (const key of ['gameState', 'payload']) if (record[key]) stack.push(record[key]);
    }
    for (const record of records.reverse()) stampStateChecksum(record);
};
export async function clearCredential(kind) {
    const dependency = {
        kind,
        before: structuredClone(knownEpochs),
        beforeGameplay: gameplayChecksum(gameState),
        gameplayChecksum: null,
        authority: null,
        promise: null,
        clearGeneration: ++clearGeneration,
    };
    pendingCredentialSaves.add(dependency);
    let started = false;
    dependency.promise = serializeManagedMutation(async () => {
        await ready;
        let db;
        try {
            db = await openManagedGameDB();
        } catch {
            return { status: 'not-started', committed: [] };
        }
        try {
            dependency.before = credentialAuthority((await readManagedGame(db)).meta);
            const result = await clearManagedCredential(
                db,
                kind,
                stampOwnedState,
                buildLightweightSnapshot
            );
            if (result.status !== 'not-started') {
                started = true;
                gameState = scrubCredential(gameState, kind);
                stampStateChecksum(gameState);
                state.set(gameState);
                recovery = null;
                const persisted = await readManagedGame(db);
                knownEpochs = credentialAuthority(persisted.meta);
                durableChecksum = persisted.state?._meta?.checksum ?? null;
                if (result.status === 'complete') {
                    dependency.gameplayChecksum = gameplayChecksum(
                        persisted.state ?? initializeGameState()
                    );
                    dependency.authority = structuredClone(knownEpochs);
                    dependency.checksum = durableChecksum;
                    dependency.order = ++managedCommitOrder;
                }
                if (isBrowser && typeof window.BroadcastChannel === 'function') {
                    const notice = new window.BroadcastChannel('dspace-credential-epochs-v1');
                    notice.postMessage({ kind, epoch: knownEpochs[kind].epoch });
                    notice.close();
                }
                if (isBrowser)
                    window.dispatchEvent(
                        new CustomEvent('dspace-credential-cleared', { detail: { kind } })
                    );
            }
            return { status: result.status, committed: result.committed };
        } finally {
            db.close();
        }
    }).catch(() => ({
        status: started ? 'incomplete' : 'not-started',
        committed: started ? ['clear-intent'] : [],
    }));
    try {
        return await dependency.promise;
    } finally {
        pendingCredentialSaves.delete(dependency);
    }
}

export const getPersistedGameStateChecksum = () => readChecksumMarker();

export const getPersistedGameStateLightweight = async () => {
    const idbSnapshot = normalizeLightweightSnapshot(await read(META_STORE));
    if (idbSnapshot.checksum) {
        return idbSnapshot;
    }

    return readLightweightSnapshotFromLocalStorage();
};

export const getPersistedGameStateLightweightSync = () => readLightweightSnapshotFromLocalStorage();

export const getAuthoritativeQuestProgressSnapshot = (snapshot) => {
    const normalizedSnapshot = normalizeLightweightSnapshot(snapshot);
    if (normalizedSnapshot.questProgress.version !== QUEST_LIST_SNAPSHOT_VERSION) {
        return {
            authoritative: false,
            reason: 'snapshot-version-mismatch',
            completedQuestIds: [],
        };
    }

    if (!normalizedSnapshot.checksum) {
        return {
            authoritative: false,
            reason: 'missing-checksum',
            completedQuestIds: [],
        };
    }

    return {
        authoritative: true,
        version: normalizedSnapshot.questProgress.version,
        completedQuestIds: normalizedSnapshot.questProgress.completedQuestIds,
        checksum: normalizedSnapshot.checksum,
    };
};

export const syncGameStateFromLocalIfStale = (expectedChecksum = '') => {
    if (!isBrowser || pendingGameWrites || pendingCredentialSaves.size) {
        return false;
    }

    const persistedChecksum = getPersistedGameStateChecksum();
    const baselineChecksum = expectedChecksum || getGameStateChecksum();

    if (!persistedChecksum || persistedChecksum === baselineChecksum) {
        return false;
    }

    const persisted = lsRead(STATE_STORE);
    if (!persisted) {
        return false;
    }

    let mirroredAuthority;
    try {
        const lightweight = JSON.parse(localStorage.getItem(LS_LIGHTWEIGHT_KEY) || '{}');
        // Separate localStorage keys can become visible across tabs at different times.
        // Never combine new state with authority from an older mirror receipt.
        if (
            persisted?._meta?.checksum !== persistedChecksum ||
            lightweight.checksum !== persistedChecksum
        )
            return false;
        mirroredAuthority = credentialAuthority(lightweight);
    } catch {
        return false;
    }
    durableChecksum = persisted._meta.checksum;
    knownEpochs = mirroredAuthority;
    gameState = validateGameState(applyCredentialAuthority(persisted, knownEpochs));
    state.set(gameState);
    lsWrite(META_STORE, { ...buildLightweightSnapshot(gameState), credentialEpochs: knownEpochs });
    writeChecksumMarker(gameState?.[META_KEY]?.checksum ?? '');
    return true;
};
export const closeGameStateDatabaseForTesting = async () => {
    credentialNotices?.close();
    credentialNotices = undefined;
    try {
        await writeQueue.catch(() => undefined);
    } catch (err) {
        console.warn('Error awaiting pending game state writes before closing:', err);
    }

    if (!dbPromise && !dbInstance) {
        return;
    }

    try {
        const db = dbInstance ?? (await dbPromise.catch(() => undefined));
        if (db) {
            db.close();
        }
    } catch (err) {
        console.warn('Failed to close game state database for testing:', err);
    } finally {
        dbInstance = undefined;
        dbPromise = undefined;
    }
};

const buildBackupEnvelope = (state, providerHint = LOCAL_EXPORT_PROVIDER, customContent) => {
    const envelope = {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        providerHint,
        payload: sanitizeSaveForBackup(state),
    };

    if (customContent) {
        envelope.customContent = customContent;
    }

    return sanitizeSaveForBackup(envelope);
};

export const exportGameStateString = (options = {}) => {
    const { providerHint = LOCAL_EXPORT_PROVIDER, stateOverride, customContent } = options;
    const sourceState = stateOverride ?? gameState;
    const envelope = buildBackupEnvelope(sourceState, providerHint, customContent);
    const jsonStr = JSON.stringify(envelope);
    if (typeof btoa === 'function') {
        return btoa(
            Array.from(new TextEncoder().encode(jsonStr), (byte) => String.fromCharCode(byte)).join(
                ''
            )
        );
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(jsonStr, 'utf8').toString('base64');
    }
    throw new Error('Base64 encoding is not supported in this environment');
};

export const importGameStateString = async (input) => {
    const { prepareImport, assertRecoveryBudget } = await import('../importPreparation.js');
    // Complete preparation precedes readiness, queueing, preflight, and all writes.
    const plan = prepareImport(input, { origin: isBrowser ? window.location.origin : undefined });
    await ready;
    const expectedChecksum = durableChecksum;
    return serializeManagedMutation(async () => {
        if (durableChecksum !== expectedChecksum) throw new StorageOperationError('stale-plan');
        let db;
        try {
            db = await openManagedGameDB();
        } catch (error) {
            if (plan.customContent) throw error;
            // Retain the existing game-only fallback. Without durable authority,
            // neither imported nor previously cached credentials can be enabled.
            assertRecoveryBudget(gameState);
            const next = validateGameState(structuredClone(plan.game));
            const backup = scrubCredential(scrubCredential(gameState, 'github'), 'openAI');
            stampStateChecksum(backup);
            mirrorManagedGame({ state: next, backup, meta: buildLightweightSnapshot(next) });
            gameState = next;
            durableChecksum = next._meta.checksum;
            useLocalStorage = true;
            recovery = null;
            state.set(gameState);
            return {
                status: 'best-effort',
                committed: ['localStorage'],
                credentialsDisabled: true,
            };
        }
        let custom;
        const committed = [];
        try {
            if (plan.customContent) custom = await preflightCustomImport();
            const previous = await readManagedGame(db);
            if (previous.state && (previous.state._meta?.checksum ?? null) !== expectedChecksum)
                throw new StorageOperationError('stale-plan');
            const authority = credentialAuthority(previous.meta);
            const next = validateGameState(structuredClone(plan.game));
            for (const kind of ['github', 'openAI'])
                if (previous.state?.[kind]) next[kind] = structuredClone(previous.state[kind]);
            stampStateChecksum(next);
            recovery = null;
            try {
                const before = {
                    game: previous.state ?? gameState,
                    custom: custom?.snapshot ?? null,
                };
                assertRecoveryBudget(before);
                recovery = { before: sanitizeSaveForBackup(before), expected: null, mode: 'game' };
            } catch {
                /* Existing destination exceeds the bounded in-memory recovery budget. */
            }
            const receipt = await commitManagedGame(db, {
                next,
                backup: previous.state ?? gameState,
                expectedChecksum: previous.state?._meta?.checksum,
                expectedEpochs: authority,
                stamp: stampStateChecksum,
                lightweight: buildLightweightSnapshot,
            });
            committed.push('game');
            if (recovery) recovery.expected = receipt.state._meta.checksum;
            durableChecksum = receipt.state?._meta?.checksum ?? null;
            gameState = receipt.state;
            knownEpochs = credentialAuthority(receipt.meta);
            state.set(gameState);
            if (custom) {
                try {
                    await commitCustomImport(custom.db, plan.customContent, custom.snapshot, true);
                    committed.push('custom');
                } catch {
                    const error = new StorageOperationError('partial', committed);
                    error.recovery = recovery?.mode ?? null;
                    throw error;
                }
            }
            try {
                mirrorManagedGame(receipt);
                committed.push('mirrors');
            } catch {
                if (recovery) recovery.mode = 'mirrors';
                const error = new StorageOperationError('mirror-incomplete', committed);
                error.recovery = recovery?.mode ?? null;
                throw error;
            }
            recovery = null;
            return { status: 'complete', committed };
        } finally {
            custom?.db.close();
            db.close();
        }
    });
};

// Explicit, bounded recovery of the committed game component after a failed second commit.
// Never restores credentials, and refuses to overwrite any later state.
export const getImportRecoveryStatus = () => {
    if (recovery && durableChecksum !== recovery.expected) recovery = null;
    return recovery?.mode ?? null;
};
export async function recoverImportGameState() {
    if (!recovery || !recovery.expected || durableChecksum !== recovery.expected) {
        recovery = null;
        throw new StorageOperationError('recovery-stale-or-unavailable');
    }
    const snapshot = recovery;
    if (snapshot.mode === 'mirrors') {
        return serializeManagedMutation(async () => {
            const db = await openManagedGameDB();
            try {
                const persisted = await readManagedGame(db);
                if (
                    persisted.state?._meta?.checksum !== snapshot.expected ||
                    recovery !== snapshot
                ) {
                    if (recovery === snapshot) recovery = null;
                    throw new StorageOperationError('recovery-stale-or-unavailable');
                }
                mirrorManagedGame(persisted);
                recovery = null;
                return { status: 'complete', committed: ['mirrors'] };
            } finally {
                db.close();
            }
        });
    }
    const result = await saveGameState(snapshot.before.game);
    if (recovery === snapshot) recovery = null;
    return result;
}
export const resetGameState = async () => {
    await ready;
    return serializeManagedMutation(async () => {
        const db = await openManagedGameDB();
        try {
            const previous = await readManagedGame(db);
            const receipt = await commitManagedGame(db, {
                next: validateGameState(initializeGameState()),
                backup: undefined,
                expectedChecksum: previous.state?._meta?.checksum,
                expectedEpochs: credentialAuthority(previous.meta),
                stamp: stampStateChecksum,
                lightweight: buildLightweightSnapshot,
            });
            durableChecksum = receipt.state?._meta?.checksum ?? null;
            gameState = receipt.state;
            knownEpochs = credentialAuthority(receipt.meta);
            state.set(gameState);
            try {
                mirrorManagedGame(receipt);
            } catch {
                throw new StorageOperationError('mirror-incomplete', ['game']);
            }
            recovery = null;
            return { status: 'complete', committed: ['game', 'mirrors'] };
        } finally {
            db.close();
        }
    });
};
export const rollbackGameState = async () => {
    await ready;
    const db = await openManagedGameDB();
    let snapshot;
    try {
        snapshot = await readManagedGame(db);
    } finally {
        db.close();
    }
    const backup = snapshot.backup ?? lsRead(BACKUP_STORE);
    if (!backup) return;
    return saveGameState(applyCredentialAuthority(backup, credentialAuthority(snapshot.meta)));
};

export const inspectGameStateStorage = async () => {
    const supportsIndexedDB = isBrowser && 'indexedDB' in globalThis;

    const localStorageState = isBrowser ? lsRead(STATE_STORE) : undefined;
    const localStorageBackup = isBrowser ? lsRead(BACKUP_STORE) : undefined;
    const legacyV2Read = isBrowser ? readLegacyV2LocalStorage() : null;
    const legacyV2State = legacyV2Read?.state;
    const legacyV2ParseIssues = legacyV2Read?.errors ?? [];
    const hasLegacyV2Keys = Boolean(legacyV2State) || legacyV2ParseIssues.length > 0;

    let indexedDbState;
    if (supportsIndexedDB && !useLocalStorage) {
        try {
            indexedDbState = await idbRead(STATE_STORE);
        } catch (err) {
            console.warn('IndexedDB inspection failed:', err);
        }
    }

    return {
        indexedDbSupported: supportsIndexedDB,
        indexedDbState,
        localStorageState,
        localStorageBackup,
        legacyV2State,
        legacyV2ParseIssues,
        hasLegacyV2Keys,
        usesLocalStorageFallback: useLocalStorage,
        loadedFromPersistence,
    };
};
