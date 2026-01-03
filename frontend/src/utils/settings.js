import {
    DEFAULT_SETTINGS,
    loadGameState,
    ready,
    saveGameState,
    validateGameState,
} from './gameState/common.js';

export const getSettings = (state = loadGameState()) => {
    const source = state?.settings && typeof state.settings === 'object' ? state.settings : {};
    return {
        ...DEFAULT_SETTINGS,
        ...source,
    };
};

export const updateSettings = async (partialSettings) => {
    await ready;
    const gameState = loadGameState();
    const nextSettings = {
        ...getSettings(gameState),
        ...partialSettings,
    };
    const nextState = validateGameState({
        ...gameState,
        settings: nextSettings,
    });
    await saveGameState(nextState);
    return nextSettings;
};
