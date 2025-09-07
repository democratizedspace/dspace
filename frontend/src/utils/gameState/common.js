import { writable } from 'svelte/store';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const ROOT_KEY = 'root';

const gameStateKey = 'gameState';
const gameStateBackupKey = 'gameStateBackup';

let dbPromise;
let useLocalStorage = false;
let warned = false;

function alertFallback(err) {
    if (useLocalStorage) return;
    useLocalStorage = true;
    console.warn('IndexedDB unavailable, falling back to localStorage:', err);
    if (typeof window !== 'undefined' && typeof window.alert === 'function' && !warned) {
        window.alert(
            'IndexedDB is unavailable. Progress is stored in localStorage and may be lost.'
        );
        warned = true;
    }
}

function openDB() {
    if (useLocalStorage) return Promise.reject(new Error('IndexedDB disabled'));
    if (!('indexedDB' in globalThis)) {
        return Promise.reject(new Error('IndexedDB is not supported'));
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
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return dbPromise;
}

async function read(store) {
    const key = store === STATE_STORE ? gameStateKey : gameStateBackupKey;
    if (useLocalStorage) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }
    try {
        const db = await openDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const req = tx.objectStore(store).get(ROOT_KEY);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        alertFallback(err);
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }
}

async function write(store, value) {
    const key = store === STATE_STORE ? gameStateKey : gameStateBackupKey;
    if (useLocalStorage) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).put(value, ROOT_KEY);
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
        });
        return true;
    } catch (err) {
        alertFallback(err);
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }
}

async function clearStore(store) {
    const key = store === STATE_STORE ? gameStateKey : gameStateBackupKey;
    if (useLocalStorage) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
        });
        return true;
    } catch (err) {
        alertFallback(err);
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
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
    const backupOk = await write(BACKUP_STORE, snapshot);
    gameState = validateGameState(newState);
    state.set(gameState);
    const stateOk = await write(STATE_STORE, gameState);
    return backupOk && stateOk;
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

export const usingLocalStorageFallback = () => useLocalStorage;
