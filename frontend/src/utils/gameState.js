import {
    loadGameState,
    saveGameState,
    validateGameState,
    isUsingLocalStorage,
    getPersistedStateSnapshots,
    clearLegacyLocalState,
} from './gameState/common.js';
import { addItems } from './gameState/inventory.js';
import { isBrowser } from './ssr.js';
import { getCookieItems } from './migrationCookies.js';
import items from '../pages/inventory/json/items';

export const VERSIONS = {
    V1: '1',
    V2: '2',
    V3: '3',
};

const EARLY_ADOPTER_ID = items.find((i) => i.name === 'Early Adopter Token')?.id;
const addInventoryToState = (state, inventoryUpdates) => {
    Object.entries(inventoryUpdates).forEach(([id, count]) => {
        if (!count || Number.isNaN(count)) return;
        state.inventory[id] = (state.inventory[id] || 0) + count;
    });
};

export const normalizeToV3State = (state) => {
    const normalized = validateGameState(structuredClone(state ?? {}));
    if (!normalized.processes) {
        normalized.processes = {};
    }
    normalized.versionNumberString = VERSIONS.V3;
    return normalized;
};

export const buildV2StateFromV1Items = (itemList = []) => {
    const baseState = validateGameState({
        quests: {},
        inventory: {},
        processes: {},
    });
    const tallied = itemList.reduce((inventory, { id, count }) => {
        if (!id || typeof count !== 'number') {
            return inventory;
        }
        const parsedCount = Number(count);
        if (Number.isNaN(parsedCount) || parsedCount <= 0) {
            return inventory;
        }
        inventory[id] = (inventory[id] || 0) + parsedCount;
        return inventory;
    }, {});
    addInventoryToState(baseState, tallied);
    if (EARLY_ADOPTER_ID) {
        baseState.inventory[EARLY_ADOPTER_ID] = (baseState.inventory[EARLY_ADOPTER_ID] || 0) + 1;
    }
    baseState.versionNumberString = VERSIONS.V2;
    return baseState;
};

export const mergeGameStates = (baseState, incomingState) => {
    const target = normalizeToV3State(baseState);
    const incoming = normalizeToV3State(incomingState);

    addInventoryToState(target, incoming.inventory);
    target.quests = { ...incoming.quests, ...target.quests };
    target.processes = { ...incoming.processes, ...target.processes };
    return target;
};

// ---------------------
// QUESTS
// ---------------------

export const finishQuest = (questId, rewardItems) => {
    addItems(rewardItems);

    const gameState = loadGameState();
    gameState.quests[questId] = { finished: true };
    saveGameState(gameState);
};

export const questFinished = (questId) => {
    const gameState = loadGameState();

    const finished = gameState.quests[questId] ? gameState.quests[questId].finished : false;
    return finished;
};

export const canStartQuest = (quest) => {
    if (questFinished(quest.id)) {
        return false;
    }

    const requiresQuests = quest.default.requiresQuests;

    if (requiresQuests) {
        for (let i = 0; i < requiresQuests.length; i++) {
            if (!questFinished(requiresQuests[i])) {
                return false;
            }
        }
    }

    return true;
};

export const setCurrentDialogueStep = (questId, stepId) => {
    const gameState = loadGameState();

    gameState.quests[questId] = { stepId };
    saveGameState(gameState);
};

export const getCurrentDialogueStep = (questId) => {
    const gameState = loadGameState();

    return gameState.quests[questId] ? gameState.quests[questId].stepId : 0;
};

const setItemsGranted = (questId, stepId, optionIndex) => {
    const gameState = loadGameState();

    const key = `${questId}-${stepId}-${optionIndex}`;
    gameState.quests[questId] = {
        ...gameState.quests[questId],
        itemsClaimed: [...(gameState.quests[questId].itemsClaimed || []), key],
    };
    saveGameState(gameState);
};

export const getItemsGranted = (questId, stepId, optionIndex) => {
    const gameState = loadGameState();

    try {
        const key = `${questId}-${stepId}-${optionIndex}`;
        const itemsClaimed = gameState.quests[questId].itemsClaimed;
        return itemsClaimed && itemsClaimed.includes(key);
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const grantItems = (questId, stepId, optionIndex, itemList) => {
    if (getItemsGranted(questId, stepId, optionIndex)) {
        return;
    }
    addItems(itemList);
    setItemsGranted(questId, stepId, optionIndex);
};

// ---------------------
// IMPORTER
// ---------------------

export const setVersionNumber = (versionNumber) => {
    const gameState = loadGameState();

    gameState.versionNumberString = versionNumber;
    saveGameState(gameState);
};

export const getVersionNumber = () => {
    const gameState = loadGameState();

    return gameState.versionNumberString;
};

// v1 -> v2
export const importV1V2 = (itemList) => {
    const gameState = loadGameState();
    const legacyState = buildV2StateFromV1Items(itemList);
    addInventoryToState(gameState, legacyState.inventory);
    gameState.versionNumberString = VERSIONS.V2;
    saveGameState(gameState);
};

// v2 -> v3
export const importV2V3 = async () => {
    // Only run in browser environment
    if (!isBrowser) return;

    let migrated;
    try {
        const legacy = localStorage.getItem('gameState');
        if (legacy) {
            migrated = validateGameState(JSON.parse(legacy));
        }
    } catch (err) {
        console.error('Error reading legacy v2 state:', err);
    }
    if (!migrated) return;
    const normalized = normalizeToV3State(migrated);
    await saveGameState(normalized);

    if (!isUsingLocalStorage()) {
        try {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameStateBackup');
        } catch {
            /* ignore */
        }
    }
};

// Auto-migrate legacy v2 state on first v3 load when localStorage data is present.
try {
    if (isBrowser && localStorage.getItem('gameState')) {
        importV2V3();
    }
} catch {
    /* ignore */
}

export const detectGameSaveVersions = async (cookieHeader = '') => {
    const legacyV1Items = getCookieItems(cookieHeader);
    const snapshots = await getPersistedStateSnapshots();
    const legacyLocal =
        snapshots.localState &&
        (snapshots.localState.versionNumberString === VERSIONS.V2 ||
            !snapshots.localState.versionNumberString)
            ? snapshots.localState
            : undefined;
    const indexedLegacy =
        snapshots.indexedDbState && snapshots.indexedDbState.versionNumberString === VERSIONS.V2
            ? snapshots.indexedDbState
            : undefined;
    const v3State =
        snapshots.indexedDbState?.versionNumberString === VERSIONS.V3
            ? snapshots.indexedDbState
            : snapshots.localState?.versionNumberString === VERSIONS.V3
              ? snapshots.localState
              : undefined;

    return {
        cookieHeader,
        legacyV1Items,
        legacyV2State: indexedLegacy ?? legacyLocal,
        v3State,
        usingLocalStorage: snapshots.usingLocalStorage,
    };
};

export const discardLegacyLocalState = () => {
    clearLegacyLocalState();
};
