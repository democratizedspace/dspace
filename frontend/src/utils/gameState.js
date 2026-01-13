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
import {
    V1_CURRENCY_SYMBOL_TO_V3_UUID,
    V1_ITEM_ID_TO_V3_UUID,
} from './legacyV1ItemIdMap.js';

const EARLY_ADOPTER_ID = items.find((i) => i.name === 'Early Adopter Token')?.id;
const LEGACY_V2_UPGRADE_TROPHY_ID = items.find((i) => i.name === 'V2 Upgrade Trophy')?.id;
const LEGACY_V1_ITEM_ID_REGEX = /^\\d+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const sanitizeLegacyInventory = (inventory) => {
    if (!inventory || typeof inventory !== 'object') return {};
    return Object.entries(inventory).reduce((acc, [id, count]) => {
        if (!id || !String(id).trim()) return acc;
        const parsedCount = normalizeCount(count);
        if (parsedCount <= 0) return acc;
        acc[id] = parsedCount;
        return acc;
    }, {});
};

const normalizeLegacyV2State = (legacyState) => {
    if (!legacyState || typeof legacyState !== 'object') return null;
    const candidate =
        legacyState && typeof legacyState === 'object' && 'gameState' in legacyState
            ? legacyState.gameState
            : legacyState;
    if (!candidate || typeof candidate !== 'object') return null;

    return {
        inventory: sanitizeLegacyInventory(candidate.inventory),
        quests: candidate.quests && typeof candidate.quests === 'object' ? candidate.quests : {},
        processes:
            candidate.processes && typeof candidate.processes === 'object'
                ? candidate.processes
                : {},
        settings: candidate.settings,
        versionNumberString: candidate.versionNumberString ?? candidate.versionNumber,
    };
};

const mapLegacyV1Items = (legacyItems) => {
    const mapped = [];
    const skipped = [];

    (Array.isArray(legacyItems) ? legacyItems : []).forEach((item) => {
        const legacyId = item?.id;
        const parsedCount = normalizeCount(item?.count);
        if (!legacyId || parsedCount <= 0) return;

        const source =
            item?.source ??
            (item?.legacyKey?.startsWith('currency-balance-') ? 'currency' : 'item');
        let mappedId;

        if (source === 'currency') {
            const symbol = item?.currencySymbol ?? legacyId;
            mappedId = V1_CURRENCY_SYMBOL_TO_V3_UUID[symbol];
        } else if (UUID_REGEX.test(legacyId)) {
            mappedId = legacyId;
        } else if (LEGACY_V1_ITEM_ID_REGEX.test(legacyId)) {
            mappedId = V1_ITEM_ID_TO_V3_UUID[legacyId];
        }

        if (!mappedId) {
            skipped.push({ id: legacyId, count: parsedCount, source });
            return;
        }

        mapped.push({ id: mappedId, count: parsedCount });
    });

    if (skipped.length > 0) {
        console.warn('Skipped legacy v1 items without a v3 mapping:', skipped);
    }

    return mapped;
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
    const { replaceExisting = false } = options;

    const baseState = replaceExisting ? validateGameState({}) : validateGameState(loadGameState());
    const nextState = structuredClone(baseState);

    const mappedItems = mapLegacyV1Items(itemList);
    const hasLegacyItems = mappedItems.length > 0;

    nextState.inventory = nextState.inventory ?? {};
    mappedItems.forEach(({ id, count }) => {
        if (!id || count <= 0) return;
        nextState.inventory[id] = (nextState.inventory[id] || 0) + count;
    });

    if (hasLegacyItems) {
        grantTrophyIfMissing(nextState, EARLY_ADOPTER_ID);
    }

    return persistMigratedState(nextState);
};

// v2 -> v3
export const importV2V3 = async (legacyState) => {
    // Only run in browser environment
    if (!isBrowser) return null;

    let migrated = normalizeLegacyV2State(legacyState);
    if (!migrated) {
        try {
            const legacy = localStorage.getItem('gameState');
            if (legacy) {
                const parsed = JSON.parse(legacy);
                migrated = normalizeLegacyV2State(parsed);
            }
        } catch (err) {
            console.error('Error reading legacy v2 state:', err);
        }
    }
    if (!migrated) return null;
    const normalized = validateGameState(structuredClone(migrated));
    grantTrophyIfMissing(normalized, LEGACY_V2_UPGRADE_TROPHY_ID);
    return persistMigratedState(normalized);
};

export const mergeLegacyStateIntoCurrent = async (legacyState) => {
    if (!isBrowser || !legacyState || typeof legacyState !== 'object') return null;
    const normalizedLegacy = normalizeLegacyV2State(legacyState);
    if (!normalizedLegacy) return null;
    const current = validateGameState(loadGameState());
    const incoming = validateGameState(structuredClone(normalizedLegacy));
    const merged = validateGameState(structuredClone(current));

    merged.inventory = merged.inventory ?? {};
    Object.entries(incoming.inventory || {}).forEach(([id, count]) => {
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
