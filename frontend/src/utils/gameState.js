import {
    loadGameState,
    saveGameState,
    validateGameState,
    isUsingLocalStorage,
} from './gameState/common.js';
import { addItems } from './gameState/inventory.js';
import { isBrowser } from './ssr.js';
import items from '../pages/inventory/json/items';
import { normalizeSettings } from './settingsDefaults.js';
import { readLegacyV2Storage } from './legacyV2Storage.js';
import {
    mapLegacyV1CurrencyBalancesToV3,
    mapLegacyV1ItemsToV3,
} from './legacyV1ItemIdMap.ts';

const EARLY_ADOPTER_ID = items.find((i) => i.name === 'Early Adopter Token')?.id;
const LEGACY_V2_UPGRADE_TROPHY_ID = items.find((i) => i.name === 'V2 Upgrade Trophy')?.id;

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

export const VERSIONS = {
    V1: '1',
    V2: '2',
    V3: '3',
};

export const setVersionNumber = (versionNumber) => {
    const gameState = loadGameState();

    gameState.versionNumberString = versionNumber;
    saveGameState(gameState);
};

export const getVersionNumber = () => {
    const gameState = loadGameState();

    return gameState.versionNumberString;
};

export const normalizeCount = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeLegacyInventory = (inventory = {}) => {
    const sanitized = {};
    Object.entries(inventory).forEach(([id, count]) => {
        if (!id) return;
        const parsed = normalizeCount(count);
        if (parsed <= 0) return;
        sanitized[id] = parsed;
    });
    return sanitized;
};

const sanitizeLegacyV2State = (legacyState) => {
    const normalized = validateGameState(structuredClone(legacyState));
    normalized.inventory = sanitizeLegacyInventory(normalized.inventory);
    return normalized;
};

const grantTrophyIfMissing = (state, trophyId) => {
    if (!trophyId) return;
    state.inventory = state.inventory ?? {};
    if (!state.inventory[trophyId] || state.inventory[trophyId] <= 0) {
        state.inventory[trophyId] = 1;
    }
};

const persistMigratedState = async (state) => {
    const migrated = validateGameState(structuredClone(state));
    migrated.versionNumberString = VERSIONS.V3;

    if (isBrowser && !isUsingLocalStorage()) {
        try {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameStateBackup');
        } catch {
            /* ignore */
        }
    }

    await saveGameState(migrated);
    return migrated;
};

// v1 -> v2
export const importV1V2 = (itemList) => {
    const gameState = loadGameState();

    const award = {
        id: EARLY_ADOPTER_ID,
        count: 1,
    };

    addItems([award, ...itemList]);
    setVersionNumber(VERSIONS.V2);
    saveGameState(gameState);
};

export const importV1V3 = async (itemList, options = {}) => {
    if (!isBrowser) return null;
    const { replaceExisting = false, legacyCurrencyBalances = [] } = options;

    const { mappedItems } = mapLegacyV1ItemsToV3(Array.isArray(itemList) ? itemList : []);
    const mappedCurrency = mapLegacyV1CurrencyBalancesToV3(legacyCurrencyBalances);

    const normalizedItems = [...mappedItems, ...mappedCurrency].map(({ id, count }) => ({
        id,
        parsedCount: normalizeCount(count),
    }));

    const baseState = replaceExisting ? validateGameState({}) : validateGameState(loadGameState());
    const nextState = structuredClone(baseState);

    const hasLegacyItems = normalizedItems.some(({ id, parsedCount }) => id && parsedCount > 0);
    const itemsToImport = normalizedItems.filter(({ id, parsedCount }) => id && parsedCount > 0);

    nextState.inventory = nextState.inventory ?? {};
    itemsToImport.forEach(({ id, parsedCount }) => {
        if (!id || parsedCount <= 0) return;
        nextState.inventory[id] = (nextState.inventory[id] || 0) + parsedCount;
    });

    if (hasLegacyItems) {
        grantTrophyIfMissing(nextState, EARLY_ADOPTER_ID);
    }

    return persistMigratedState(nextState);
};

// v2 -> v3
export const importV2V3 = async (legacyState) => {
    if (!isBrowser) return null;

    let migrated = legacyState;
    if (!migrated) {
        const legacyInspection = readLegacyV2Storage();
        if (legacyInspection.errors?.length && !legacyInspection.legacyState) {
            console.error('Error reading legacy v2 state:', legacyInspection.errors);
        }
        migrated = legacyInspection.legacyState;
    }
    if (!migrated) return null;
    const normalized = sanitizeLegacyV2State(migrated);
    grantTrophyIfMissing(normalized, LEGACY_V2_UPGRADE_TROPHY_ID);
    return persistMigratedState(normalized);
};

export const mergeLegacyStateIntoCurrent = async (legacyState) => {
    if (!isBrowser || !legacyState || typeof legacyState !== 'object') return null;

    const current = validateGameState(loadGameState());
    const incoming = sanitizeLegacyV2State(legacyState);
    const merged = validateGameState(structuredClone(current));

    merged.inventory = merged.inventory ?? {};
    Object.entries(incoming.inventory || {}).forEach(([id, count]) => {
        if (!id) return;
        const parsedCount = normalizeCount(count);
        if (parsedCount <= 0) return;
        merged.inventory[id] = (merged.inventory[id] || 0) + parsedCount;
    });

    merged.quests = merged.quests ?? {};
    Object.entries(incoming.quests || {}).forEach(([questId, questState]) => {
        if (!merged.quests[questId]) {
            merged.quests[questId] = questState;
        }
    });

    merged.processes = merged.processes ?? {};
    Object.entries(incoming.processes || {}).forEach(([processId, processState]) => {
        if (!merged.processes[processId]) {
            merged.processes[processId] = processState;
        }
    });

    merged.settings = normalizeSettings({
        ...normalizeSettings(current.settings),
        ...normalizeSettings(incoming.settings),
    });

    grantTrophyIfMissing(merged, LEGACY_V2_UPGRADE_TROPHY_ID);

    return persistMigratedState(merged);
};

// Auto-migrate legacy v2 state on first v3 load when localStorage data is present.
try {
    if (isBrowser && localStorage.getItem('gameState')) {
        importV2V3();
    }
} catch {
    /* ignore */
}
