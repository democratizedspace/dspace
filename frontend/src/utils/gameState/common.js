import { writable } from 'svelte/store';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const ROOT_KEY = 'root';
const LOCAL_STATE_KEY = 'gameState_v3';
const LOCAL_BACKUP_KEY = 'gameStateBackup_v3';

let dbPromise;
let useLocalStorage = false;
let warnedFallback = false;

function warnFallback() {
    if (warnedFallback) return;
    warnedFallback = true;
    const message =
        'IndexedDB is unavailable; falling back to localStorage. Progress may not fully persist.';
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
    }
    // eslint-disable-next-line no-console
    console.warn(message);
}

function openDB() {
    if (useLocalStorage) return Promise.resolve(null);
    if (!dbPromise) {
        if (typeof indexedDB === 'undefined') {
            useLocalStorage = true;
            warnFallback();
            return Promise.resolve(null);
        }
        dbPromise = new Promise((resolve) => {
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
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                useLocalStorage = true;
                warnFallback();
                resolve(null);
            };
        });
    }
    return dbPromise;
}

function keyFor(store) {
    return store === STATE_STORE ? LOCAL_STATE_KEY : LOCAL_BACKUP_KEY;
}

function read(store) {
    return openDB().then((db) => {
        if (!db) {
            try {
                const raw = localStorage.getItem(keyFor(store));
                return raw ? JSON.parse(raw) : undefined;
            } catch (err) {
                console.error('Error reading game state from localStorage:', err);
                return undefined;
            }
        }
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const req = tx.objectStore(store).get(ROOT_KEY);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    });
}

function write(store, value) {
    return openDB().then((db) => {
        if (!db) {
            try {
                localStorage.setItem(keyFor(store), JSON.stringify(value));
                return true;
            } catch (err) {
                console.error('Error writing game state to localStorage:', err);
                return false;
            }
        }
        return new Promise((resolve) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).put(value, ROOT_KEY);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => {
                useLocalStorage = true;
                warnFallback();
                try {
                    localStorage.setItem(keyFor(store), JSON.stringify(value));
                    resolve(true);
                } catch (err) {
                    console.error('Error writing game state to localStorage:', err);
                    resolve(false);
                }
            };
        });
    });
}

function clearStore(store) {
    return openDB().then((db) => {
        if (!db) {
            try {
                localStorage.removeItem(keyFor(store));
                return true;
            } catch (err) {
                console.error('Error clearing game state from localStorage:', err);
                return false;
            }
        }
        return new Promise((resolve) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => {
                useLocalStorage = true;
                warnFallback();
                try {
                    localStorage.removeItem(keyFor(store));
                    resolve(true);
                } catch (err) {
                    console.error('Error clearing game state from localStorage:', err);
                    resolve(false);
                }
            };
        });
    });
}

const initializeGameState = () => ({ quests: {}, inventory: {}, processes: {} });

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

export const loadGameState = () => structuredClone(gameState);

export const saveGameState = async (newState) => {
    await ready;
    const snapshot = structuredClone(gameState);
    await write(BACKUP_STORE, snapshot);
    gameState = validateGameState(newState);
    state.set(gameState);
    return write(STATE_STORE, gameState);
};

export const exportGameStateString = () => btoa(JSON.stringify(gameState));

export const importGameStateString = async (gameStateString) => {
    const imported = JSON.parse(atob(gameStateString));
    await saveGameState(imported);
};

export const resetGameState = async () => {
    gameState = initializeGameState();
    state.set(gameState);
    await write(STATE_STORE, gameState);
    await clearStore(BACKUP_STORE);
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
