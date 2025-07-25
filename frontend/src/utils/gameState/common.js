import { writable } from 'svelte/store';

const gameStateKey = 'gameState';
const gameStateBackupKey = 'gameStateBackup';

const initializeGameState = () => {
    return {
        quests: {},
        inventory: {},
        processes: {},
    };
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

    return state;
};

export const loadGameState = () => {
    const storedGameState = localStorage.getItem(gameStateKey);
    if (storedGameState) {
        return validateGameState(JSON.parse(storedGameState));
    }
    return initializeGameState();
};

export const saveGameState = (newState) => {
    localStorage.setItem(gameStateBackupKey, JSON.stringify(gameState));
    gameState = validateGameState(newState);
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
    state.set(gameState); // Update the state store directly
};

let gameState = loadGameState();

// Create the state store and set the initial value
export const state = writable(gameState);

export const exportGameStateString = () => {
    return btoa(JSON.stringify(gameState));
};

export const importGameStateString = (gameStateString) => {
    // Decode from Base64 and parse the JSON string
    const importedGameState = JSON.parse(atob(gameStateString));

    // Overwrite the game state with the imported game state
    gameState = importedGameState;

    // Save the updated game state to local storage and update the state store
    saveGameState(gameState);
};

export const resetGameState = () => {
    const freshState = initializeGameState();
    saveGameState(freshState);
};

export const rollbackGameState = () => {
    const backup = localStorage.getItem(gameStateBackupKey);
    if (!backup) return;
    const previous = validateGameState(JSON.parse(backup));
    gameState = previous;
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
    state.set(gameState);
};
