import { writable } from 'svelte/store';
import { sanitizeSaveForBackup } from '../../lib/cloudsync/githubGists';
import { normalizeSettings, DEFAULT_SETTINGS } from '../settingsDefaults.js';
import { isBrowser } from '../ssr.js';
import { readLegacyV2LocalStorage } from '../legacySaveParsing.js';
import { restoreCustomContentBackup } from '../customContentBackup.js';
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
export const isUsingLocalStorage = () => useLocalStorage;

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

function idbWrite(store, value) {
    return openDB().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(store, 'readwrite');
                tx.objectStore(store).put(value, ROOT_KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e.target.error);
            })
    );
}

function idbClear(store) {
    return openDB().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(store, 'readwrite');
                tx.objectStore(store).clear();
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e.target.error);
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

function lsClear(store) {
    if (!isBrowser) return;
    try {
        localStorage.removeItem(lsKey(store));
    } catch (err) {
        logPersistenceIssue('Error clearing localStorage:', err);
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

async function write(store, value, options = {}) {
    // On server, skip all persistence - storage is client-only
    if (!isBrowser) return;
    const { skipLocalStorage = false } = options;

    if (!skipLocalStorage) {
        lsWrite(store, value);
    }
    if (useLocalStorage) return;
    try {
        await idbWrite(store, value);
    } catch (err) {
        logPersistenceIssue('IndexedDB write failed:', err);
        useLocalStorage = true;
        warnFallback();
    }
}

async function clearStore(store) {
    // On server, skip all persistence - storage is client-only
    if (!isBrowser) return;
    lsClear(store);
    if (useLocalStorage) return;
    try {
        await idbClear(store);
    } catch (err) {
        logPersistenceIssue('IndexedDB clear failed:', err);
        useLocalStorage = true;
        warnFallback();
    }
}

const initializeGameState = () => ({
    quests: {},
    inventory: {},
    processes: {},
    itemContainerCounts: {},
    settings: { ...DEFAULT_SETTINGS },
    versionNumberString: CURRENT_VERSION,
    [META_KEY]: { lastUpdated: Date.now() },
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

const stampStateChecksum = (state) => {
    ensureMeta(state);
    state[META_KEY].checksum = computeChecksum(state);
};

export const validateGameState = (state) => {
    if (!state || typeof state !== 'object') {
        return initializeGameState();
    }
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

// Only execute in browser environment to avoid SSR issues with IndexedDB
export const ready = isBrowser
    ? (async () => {
          try {
              const stored = await read(STATE_STORE);
              if (stored) {
                  gameState = validateGameState(stored);
                  state.set(gameState);
                  loadedFromPersistence = true;
              }
              await write(META_STORE, buildLightweightSnapshot(gameState));
              writeChecksumMarker(gameState[META_KEY].checksum);
          } catch (err) {
              logPersistenceIssue('Error loading game state from IndexedDB:', err);
          } finally {
              readyResolved = true;
          }
      })()
    : Promise.resolve().then(() => {
          readyResolved = true;
      });

let writeQueue = Promise.resolve();

export const flushGameStateWritesForTesting = async () => {
    await writeQueue.catch(() => undefined);
};

if (isBrowser) {
    globalThis.__dspaceFlushGameStateWrites = flushGameStateWritesForTesting;
}

export const loadGameState = () => structuredClone(gameState);

export const getGameStateChecksum = () => gameState?.[META_KEY]?.checksum ?? '';

export const isGameStateReady = () => readyResolved;
export const hasLoadedPersistedGameState = () => loadedFromPersistence;

export const saveGameState = async (newState) => {
    if (!readyResolved) {
        await ready;
    }
    const previousSnapshot = structuredClone(gameState);
    const nextState = validateGameState(structuredClone(newState));
    nextState[META_KEY].lastUpdated = Date.now();
    gameState = nextState;
    state.set(gameState);

    // Persist the latest snapshots to localStorage immediately so data survives
    // page refreshes even if the pending IndexedDB writes are interrupted.
    lsWrite(BACKUP_STORE, previousSnapshot);
    lsWrite(STATE_STORE, gameState);
    lsWrite(META_STORE, buildLightweightSnapshot(gameState));
    writeChecksumMarker(gameState[META_KEY].checksum);

    writeQueue = writeQueue.then(async () => {
        await write(BACKUP_STORE, previousSnapshot, { skipLocalStorage: true }).catch(
            () => undefined
        );
        await write(STATE_STORE, gameState, { skipLocalStorage: true }).catch(() => undefined);
        await write(META_STORE, buildLightweightSnapshot(gameState), {
            skipLocalStorage: true,
        }).catch(() => undefined);
    });
    return writeQueue;
};

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
    if (!isBrowser) {
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

    gameState = validateGameState(persisted);
    state.set(gameState);
    lsWrite(META_STORE, buildLightweightSnapshot(gameState));
    writeChecksumMarker(gameState?.[META_KEY]?.checksum ?? '');
    return true;
};
export const closeGameStateDatabaseForTesting = async () => {
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

    return envelope;
};

export const exportGameStateString = (options = {}) => {
    const { providerHint = LOCAL_EXPORT_PROVIDER, stateOverride, customContent } = options;
    const sourceState = stateOverride ?? gameState;
    const envelope = buildBackupEnvelope(sourceState, providerHint, customContent);
    const jsonStr = JSON.stringify(envelope);
    if (typeof btoa === 'function') {
        return btoa(jsonStr);
    }
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(jsonStr, 'utf8').toString('base64');
    }
    throw new Error('Base64 encoding is not supported in this environment');
};

const decodeBase64 = (value) => {
    if (typeof atob === 'function') {
        return atob(value);
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(value, 'base64').toString('utf8');
    }

    throw new Error('Base64 decoding is not supported in this environment');
};

export const importGameStateString = async (gameStateString) => {
    if (typeof gameStateString !== 'string') {
        throw new TypeError('Expected serialized game state to be a string');
    }

    const serialized = gameStateString.trim();
    let imported;

    try {
        imported = JSON.parse(serialized);
    } catch (directParseError) {
        const decoded = decodeBase64(serialized);
        try {
            imported = JSON.parse(decoded);
        } catch (decodedParseError) {
            decodedParseError.cause = decodedParseError.cause ?? directParseError;
            throw decodedParseError;
        }
    }

    let payload = imported;
    const customContent = imported?.customContent;

    if (imported && typeof imported === 'object' && 'payload' in imported) {
        if (
            Object.prototype.hasOwnProperty.call(imported, 'schemaVersion') &&
            imported.schemaVersion !== BACKUP_SCHEMA_VERSION
        ) {
            throw new Error(
                `Unsupported backup schema version: ${imported.schemaVersion}, expected ${BACKUP_SCHEMA_VERSION}`
            );
        }

        payload = imported.payload;
    }

    await saveGameState(payload);

    if (customContent && isBrowser) {
        try {
            await restoreCustomContentBackup(customContent, { overwriteExisting: true });
        } catch (err) {
            logPersistenceIssue('Custom content restore failed:', err);
            throw err;
        }
    }
};

export const resetGameState = async () => {
    gameState = initializeGameState();
    validateGameState(gameState);
    state.set(gameState);
    writeChecksumMarker(gameState[META_KEY].checksum);
    await write(STATE_STORE, gameState).catch(() => undefined);
    await write(META_STORE, buildLightweightSnapshot(gameState)).catch(() => undefined);
    await clearStore(BACKUP_STORE).catch(() => undefined);
};

export const rollbackGameState = async () => {
    try {
        const backup = await read(BACKUP_STORE);
        if (!backup) return;
        gameState = validateGameState(backup);
        state.set(gameState);
        writeChecksumMarker(gameState[META_KEY].checksum);
        await write(STATE_STORE, gameState);
        await write(META_STORE, buildLightweightSnapshot(gameState));
    } catch (err) {
        logPersistenceIssue('Error rolling back game state:', err);
    }
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
