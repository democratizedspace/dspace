import { writable } from 'svelte/store';

const DB_NAME = 'dspaceGameState';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const BACKUP_STORE = 'backup';
const ROOT_KEY = 'root';

let dbPromise;

function openDB() {
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

function read(store) {
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

function write(store, value) {
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

function clearStore(store) {
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

const createInitialState = () => ({ quests: {}, inventory: {}, processes: {} });

export const validateGameState = (state) => {
    if (!state || typeof state !== 'object') {
        return createInitialState();
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

let gameState = createInitialState();
export const state = writable(gameState);

async function initializeGameState() {
    try {
        const stored = await read(STATE_STORE);
        if (stored) {
            gameState = validateGameState(stored);
            state.set(gameState);
        }
    } catch (err) {
        console.error('Error loading game state from IndexedDB:', err);
    }
}

export const ready = initializeGameState();

export const loadGameState = () => structuredClone(gameState);

export const saveGameState = (newState) =>
    ready.then(async () => {
        const snapshot = structuredClone(gameState);
        gameState = validateGameState(newState);
        state.set(gameState);
        await write(BACKUP_STORE, snapshot).catch((err) => {
            console.error('Error writing backup game state:', err);
        });
        await write(STATE_STORE, gameState);
    });

export const exportGameStateString = () => btoa(JSON.stringify(gameState));

export const importGameStateString = (gameStateString) => {
    const imported = JSON.parse(atob(gameStateString));
    return saveGameState(imported);
};

export const resetGameState = () => {
    gameState = createInitialState();
    state.set(gameState);
    write(STATE_STORE, gameState).catch((err) => {
        console.error('Error resetting game state:', err);
    });
    clearStore(BACKUP_STORE).catch((err) => {
        console.error('Error clearing backup game state:', err);
    });
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
