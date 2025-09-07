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
let warnedFallback = false;

function warnFallback(err) {
    useLocalStorage = true;
    if (!warnedFallback && typeof alert === 'function') {
        alert(
            'IndexedDB unavailable; falling back to localStorage. Progress may be lost due to storage limits.'
        );
        warnedFallback = true;
    }
    console.warn('Falling back to localStorage for game state', err);
}

function openDB() {
    if (useLocalStorage || typeof indexedDB === 'undefined') {
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
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return dbPromise;
}

async function read(store) {
    if (useLocalStorage) {
        const key = store === STATE_STORE ? gameStateKey : gameStateBackupKey;
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return undefined;
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
        warnFallback(err);
        return read(store);
    }
}

async function write(store, value) {
    if (useLocalStorage) {
        const key = store === STATE_STORE ? gameStateKey : gameStateBackupKey;
        localStorage.setItem(key, JSON.stringify(value));
        return;
    }
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).put(value, ROOT_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        warnFallback(err);
        return write(store, value);
    }
}

async function clearStore(store) {
    if (useLocalStorage) {
        const key = store === STATE_STORE ? gameStateKey : gameStateBackupKey;
        localStorage.removeItem(key);
        return;
    }
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        warnFallback(err);
        return clearStore(store);
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
export const isUsingLocalStorage = () => useLocalStorage;

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
    await write(BACKUP_STORE, snapshot).catch(() => undefined);
    gameState = validateGameState(newState);
    state.set(gameState);
    await write(STATE_STORE, gameState).catch(() => undefined);
};

export const exportGameStateString = () => btoa(JSON.stringify(gameState));

export const importGameStateString = async (gameStateString) => {
    const imported = JSON.parse(atob(gameStateString));
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
