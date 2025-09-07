import { writable } from 'svelte/store';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const ROOT_KEY = 'root';
const LS_STATE_KEY = 'gameState';
const LS_BACKUP_KEY = 'gameStateBackup';

let dbPromise;
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
            request.onsuccess = () => resolve(request.result);
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
    if (useLocalStorage) return lsRead(store);
    try {
        return await idbRead(store);
    } catch (err) {
        console.error('IndexedDB read failed:', err);
        useLocalStorage = true;
        warnFallback();
        return lsRead(store);
    }
}

async function write(store, value) {
    if (useLocalStorage) return lsWrite(store, value);
    try {
        return await idbWrite(store, value);
    } catch (err) {
        console.error('IndexedDB write failed:', err);
        useLocalStorage = true;
        warnFallback();
        return lsWrite(store, value);
    }
}

async function clearStore(store) {
    if (useLocalStorage) return lsClear(store);
    try {
        return await idbClear(store);
    } catch (err) {
        console.error('IndexedDB clear failed:', err);
        useLocalStorage = true;
        warnFallback();
        return lsClear(store);
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
