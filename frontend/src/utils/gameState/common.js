import { writable } from 'svelte/store';
import { sanitizeSaveForBackup } from '../../lib/cloudsync/githubGists';
import { normalizeSettings, DEFAULT_SETTINGS } from '../settingsDefaults.js';
import { isBrowser } from '../ssr.js';
import { readLegacyV2LocalStorage } from '../legacySaveParsing.js';
import { restoreCustomContentBackup } from '../customContentBackup.js';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const ROOT_KEY = 'root';
const META_KEY = '_meta';
const BACKUP_SCHEMA_VERSION = 1;
const LOCAL_EXPORT_PROVIDER = 'local-export';
const isDev = Boolean(import.meta?.env?.DEV);
const CURRENT_VERSION = '3';

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
let readyResolved = false;
let loadedFromPersistence = false;
export const isUsingLocalStorage = () => false;

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

async function read(store) {
    // On server, return undefined - storage is client-only
    if (!isBrowser) return undefined;
    try {
        return await idbRead(store);
    } catch (err) {
        logPersistenceIssue('IndexedDB read failed:', err);
        return undefined;
    }
}

async function write(store, value) {
    // On server, skip all persistence - storage is client-only
    if (!isBrowser) return;
    try {
        await idbWrite(store, value);
    } catch (err) {
        logPersistenceIssue('IndexedDB write failed:', err);
    }
}

async function clearStore(store) {
    // On server, skip all persistence - storage is client-only
    if (!isBrowser) return;
    try {
        await idbClear(store);
    } catch (err) {
        logPersistenceIssue('IndexedDB clear failed:', err);
    }
}

const initializeGameState = () => ({
    quests: {},
    inventory: {},
    inventoryItemCounts: {},
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
};

export const validateGameState = (state) => {
    if (!state || typeof state !== 'object') {
        return initializeGameState();
    }
    if (typeof state.quests !== 'object' || state.quests === null) {
        state.quests = {};
    }
    if (typeof state.inventory !== 'object' || state.inventory === null) {
        state.inventory = {};
    }
    if (typeof state.processes !== 'object' || state.processes === null) {
        state.processes = {};
    }
    if (typeof state.inventoryItemCounts !== 'object' || state.inventoryItemCounts === null) {
        state.inventoryItemCounts = {};
    }
    state.settings = normalizeSettings(state.settings);
    if (typeof state.versionNumberString !== 'string' || !state.versionNumberString.trim()) {
        state.versionNumberString = CURRENT_VERSION;
    }
    ensureMeta(state);
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

export const loadGameState = () => structuredClone(gameState);

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

    writeQueue = writeQueue.then(async () => {
        await write(BACKUP_STORE, previousSnapshot).catch(() => undefined);
        await write(STATE_STORE, gameState).catch(() => undefined);
    });
    return writeQueue;
};

export const flushGameStateWritesForTesting = async () => {
    await writeQueue.catch(() => undefined);
};

if (isBrowser) {
    globalThis.__dspaceFlushGameStateWrites = flushGameStateWritesForTesting;
}

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
    state.set(gameState);
    await write(STATE_STORE, gameState).catch(() => undefined);
    await clearStore(BACKUP_STORE).catch(() => undefined);
};

export const rollbackGameState = async () => {
    try {
        const backup = await read(BACKUP_STORE);
        if (!backup) return;
        gameState = validateGameState(backup);
        state.set(gameState);
        await write(STATE_STORE, gameState);
    } catch (err) {
        logPersistenceIssue('Error rolling back game state:', err);
    }
};

export const inspectGameStateStorage = async () => {
    const supportsIndexedDB = isBrowser && 'indexedDB' in globalThis;
    const legacyV2Read = isBrowser ? readLegacyV2LocalStorage() : null;
    const legacyV2State = legacyV2Read?.state;
    const legacyV2ParseIssues = legacyV2Read?.errors ?? [];
    const hasLegacyV2Keys = Boolean(legacyV2State) || legacyV2ParseIssues.length > 0;

    let indexedDbState;
    if (supportsIndexedDB) {
        try {
            indexedDbState = await idbRead(STATE_STORE);
        } catch (err) {
            console.warn('IndexedDB inspection failed:', err);
        }
    }

    return {
        indexedDbSupported: supportsIndexedDB,
        indexedDbState,
        legacyV2State,
        legacyV2ParseIssues,
        hasLegacyV2Keys,
        usesLocalStorageFallback: false,
        loadedFromPersistence,
    };
};
