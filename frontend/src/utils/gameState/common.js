import { writable } from 'svelte/store';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const ROOT_KEY = 'root';
const LS_STATE_KEY = 'gameState';
const LS_BACKUP_KEY = 'gameStateBackup';
const META_KEY = '_meta';

let dbPromise;
let dbInstance;
let useLocalStorage = false;
let warnedFallback = false;
export const isUsingLocalStorage = () => useLocalStorage;

function warnFallback() {
    if (warnedFallback) return;
    warnedFallback = true;
    const message =
        'IndexedDB is unavailable; falling back to localStorage. Storage may be limited.';
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
    } else {
        console.warn(message);
    }
}

function openDB() {
    if (!('indexedDB' in globalThis)) {
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

function lsKey(store) {
    return store === STATE_STORE ? LS_STATE_KEY : LS_BACKUP_KEY;
}

function lsRead(store) {
    try {
        const raw = localStorage.getItem(lsKey(store));
        return raw ? JSON.parse(raw) : undefined;
    } catch (err) {
        console.error('Error reading from localStorage:', err);
        return undefined;
    }
}

function lsWrite(store, value) {
    try {
        localStorage.setItem(lsKey(store), JSON.stringify(value));
    } catch (err) {
        console.error('Error writing to localStorage:', err);
    }
}

function lsClear(store) {
    try {
        localStorage.removeItem(lsKey(store));
    } catch (err) {
        console.error('Error clearing localStorage:', err);
    }
}

async function read(store) {
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
        console.error('IndexedDB read failed:', err);
        useLocalStorage = true;
        warnFallback();
        return localValue;
    }
}

async function write(store, value) {
    lsWrite(store, value);
    if (useLocalStorage) return;
    try {
        await idbWrite(store, value);
    } catch (err) {
        console.error('IndexedDB write failed:', err);
        useLocalStorage = true;
        warnFallback();
    }
}

async function clearStore(store) {
    lsClear(store);
    if (useLocalStorage) return;
    try {
        await idbClear(store);
    } catch (err) {
        console.error('IndexedDB clear failed:', err);
        useLocalStorage = true;
        warnFallback();
    }
}

const initializeGameState = () => ({
    quests: {},
    inventory: {},
    processes: {},
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
    ensureMeta(state);
    return state;
};

let gameState = initializeGameState();
export const state = writable(gameState);

export const ready = (async () => {
    try {
        const stored = await read(STATE_STORE);
        if (stored) {
            gameState = validateGameState(stored);
            state.set(gameState);
        }
    } catch (err) {
        console.error('Error loading game state from IndexedDB:', err);
    }
})();

let writeQueue = Promise.resolve();

export const loadGameState = () => structuredClone(gameState);

export const saveGameState = async (newState) => {
    await ready;
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

export const exportGameStateString = () => btoa(JSON.stringify(gameState));

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

    await saveGameState(imported);
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
        console.error('Error rolling back game state:', err);
    }
};
