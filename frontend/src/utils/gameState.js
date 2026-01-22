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
import { V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID, V1_ITEM_ID_TO_V3_UUID } from './legacyV1ItemIdMap.js';
import {
    LEGACY_V2_SEED_SKIP_KEY,
    normalizeLegacyV2State,
    readLegacyV2LocalStorage,
} from './legacySaveParsing.js';

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resolveLegacyV1ItemId = (rawId) => {
    if (rawId === null || rawId === undefined) return null;
    const trimmed = String(rawId).trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^item-(\d+)$/);
    const numeric = Number.parseInt(match ? match[1] : trimmed, 10);
    if (Number.isFinite(numeric)) {
        return V1_ITEM_ID_TO_V3_UUID[numeric] ?? null;
    }
    return UUID_REGEX.test(trimmed) ? trimmed : null;
};

const mapLegacyV1Items = (itemList, currencyBalances = []) => {
    const mapped = [];

    (Array.isArray(itemList) ? itemList : []).forEach(({ id, count }) => {
        const mappedId = resolveLegacyV1ItemId(id);
        const parsedCount = normalizeCount(count);
        if (!mappedId || parsedCount <= 0) return;
        mapped.push({ id: mappedId, parsedCount });
    });

    if (
        Array.isArray(currencyBalances) &&
        currencyBalances.length > 0 &&
        !V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID.dUSD
    ) {
        console.warn(
            'Legacy currency migration skipped: dUSD item missing from v3 catalog mapping.'
        );
        return mapped;
    }

    (Array.isArray(currencyBalances) ? currencyBalances : []).forEach(({ symbol, balance }) => {
        const mappedId = V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID[symbol];
        const parsedCount = normalizeCount(balance);
        if (!mappedId || parsedCount <= 0) return;
        mapped.push({ id: mappedId, parsedCount });
    });

    return mapped;
};

const grantTrophyIfMissing = (state, trophyId) => {
    if (!trophyId) return;
    state.inventory = state.inventory ?? {};
    if (!state.inventory[trophyId] || state.inventory[trophyId] <= 0) {
        state.inventory[trophyId] = 1;
    }
};

const resolveUpgradeOptions = (options = {}) => ({
    grantUpgradeTrophy: Boolean(options.grantUpgradeTrophy),
});

const persistMigratedState = async (state) => {
    const migrated = validateGameState(structuredClone(state));
    migrated.versionNumberString = VERSIONS.V3;

    if (isBrowser) {
        try {
            localStorage.removeItem(LEGACY_V2_SEED_SKIP_KEY);
            if (!isUsingLocalStorage()) {
                localStorage.removeItem('gameState');
                localStorage.removeItem('gameStateBackup');
            }
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
    const { replaceExisting = false, currencyBalances = [] } = options;

    const normalizedItems = mapLegacyV1Items(itemList, currencyBalances);

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
export const importV2V3 = async (legacyState, options = {}) => {
    // Only run in browser environment
    if (!isBrowser) return null;
    const { grantUpgradeTrophy } = resolveUpgradeOptions(options);

    let migrated = legacyState;
    if (!migrated) {
        const legacyRead = readLegacyV2LocalStorage();
        if (legacyRead.errors?.length) {
            legacyRead.errors.forEach((issue) => {
                console.warn(`Error reading legacy v2 ${issue.key}:`, issue.message);
            });
        }
        migrated = legacyRead.state;
    }
    if (!migrated) return null;
    const normalized = validateGameState(structuredClone(normalizeLegacyV2State(migrated)));
    if (grantUpgradeTrophy) {
        grantTrophyIfMissing(normalized, LEGACY_V2_UPGRADE_TROPHY_ID);
    }
    return persistMigratedState(normalized);
};

export const mergeLegacyStateIntoCurrent = async (legacyState, options = {}) => {
    if (!isBrowser || !legacyState || typeof legacyState !== 'object') return null;
    const { grantUpgradeTrophy } = resolveUpgradeOptions(options);

    const current = validateGameState(loadGameState());
    const incoming = validateGameState(structuredClone(normalizeLegacyV2State(legacyState)));
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

    if (grantUpgradeTrophy) {
        grantTrophyIfMissing(merged, LEGACY_V2_UPGRADE_TROPHY_ID);
    }

    return persistMigratedState(merged);
};

// Auto-migrate legacy v2 state on first v3 load when localStorage data is present.
try {
    if (
        isBrowser &&
        localStorage.getItem('gameState') &&
        !localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)
    ) {
        importV2V3();
    }
} catch {
    /* ignore */
}
