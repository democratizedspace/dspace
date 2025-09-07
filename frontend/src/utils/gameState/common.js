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

let isReady = false;
const pendingSaves = [];

function mergeStates(base, updates) {
    return validateGameState({
        ...base,
        ...updates,
        quests: { ...base.quests, ...updates.quests },
        inventory: { ...base.inventory, ...updates.inventory },
        processes: { ...base.processes, ...updates.processes },
    });
}

function applySave(newState) {
    const snapshot = structuredClone(gameState);
    write(BACKUP_STORE, snapshot).catch(() => undefined);
    gameState = mergeStates(gameState, newState);
    state.set(gameState);
    write(STATE_STORE, gameState).catch(() => undefined);
}

export const ready = (async () => {
    try {
        const stored = await read(STATE_STORE);
        if (stored) {
            gameState = validateGameState(stored);
            state.set(gameState);
        }
    } catch (err) {
        console.error('Error loading game state from IndexedDB:', err);
    } finally {
        isReady = true;
        while (pendingSaves.length) {
            applySave(pendingSaves.shift());
        }
    }
})();

export const loadGameState = () => structuredClone(gameState);

export const saveGameState = (newState) => {
    const updates = structuredClone(newState);
    if (isReady) {
        applySave(updates);
    } else {
        pendingSaves.push(updates);
    }
};

export const exportGameStateString = () => btoa(JSON.stringify(gameState));

export const importGameStateString = (gameStateString) => {
    const imported = JSON.parse(atob(gameStateString));
    saveGameState(imported);
};

export const resetGameState = () => {
    const perform = () => {
        gameState = initializeGameState();
        state.set(gameState);
        write(STATE_STORE, gameState).catch(() => undefined);
        clearStore(BACKUP_STORE).catch(() => undefined);
    };
    if (isReady) {
        perform();
    } else {
        ready.then(perform);
    }
};

export const rollbackGameState = async () => {
    try {
        await ready;
        const backup = await read(BACKUP_STORE);
        if (!backup) return;
        gameState = validateGameState(backup);
        state.set(gameState);
        await write(STATE_STORE, gameState);
    } catch (err) {
        console.error('Error rolling back game state:', err);
    }
};
