import {
    loadGameState,
    saveGameState,
    validateGameState,
    isUsingLocalStorage,
    getGameStateChecksum,
    syncGameStateFromLocalIfStale,
} from './gameState/common.js';
import { addItems } from './gameState/inventory.js';
import { isBrowser } from './ssr.js';
import items from '../pages/inventory/json/items';
import { normalizeSettings } from './settingsDefaults.js';
import { V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID, V1_ITEM_ID_TO_V3_UUID } from './legacyV1ItemIdMap.js';
import { resolveLegacyV2ItemBase } from './legacyV2ItemResolution.js';
import {
    LEGACY_V2_SEED_SKIP_KEY,
    normalizeLegacyV2State,
    readLegacyV2LocalStorage,
} from './legacySaveParsing.js';
import { UUID_REGEX } from './uuid.js';

const loadFreshStateForMutation = () => {
    const checksum = getGameStateChecksum();
    syncGameStateFromLocalIfStale(checksum);
    return loadGameState();
};

const EARLY_ADOPTER_ID = items.find((i) => i.name === 'Early Adopter Token')?.id;
const LEGACY_V2_UPGRADE_TROPHY_ID = items.find((i) => i.name === 'V2 Upgrade Trophy')?.id;
const LEGACY_V2_PROCESS_ID_MAP = {
    'processes/benchy': '3dprint-benchy',
};
let processCreateItemsByIdPromise;

const getProcessCreateItemsById = async () => {
    if (!processCreateItemsByIdPromise) {
        processCreateItemsByIdPromise = import('../generated/processes.json', {
            assert: { type: 'json' },
        })
            .then(
                ({ default: processCatalog }) =>
                    new Map(
                        (Array.isArray(processCatalog) ? processCatalog : []).map((process) => [
                            process?.id,
                            process?.createItems ?? [],
                        ])
                    )
            )
            .catch(() => new Map());
    }

    return processCreateItemsByIdPromise;
};

const resolveLegacyProcessId = (processId, processCreateItemsById) => {
    if (!processId || !processCreateItemsById?.size) {
        return null;
    }

    const trimmed = String(processId).trim();
    if (!trimmed) return null;
    if (processCreateItemsById.has(trimmed)) {
        return trimmed;
    }

    const mappedProcessId = LEGACY_V2_PROCESS_ID_MAP[trimmed];
    if (mappedProcessId && processCreateItemsById.has(mappedProcessId)) {
        return mappedProcessId;
    }

    const withoutPrefix = trimmed.replace(/^processes\//, '');
    if (processCreateItemsById.has(withoutPrefix)) {
        return withoutPrefix;
    }

    const suffixMatches = Array.from(processCreateItemsById.keys()).filter(
        (candidateId) => candidateId === withoutPrefix || candidateId.endsWith(`-${withoutPrefix}`)
    );

    return suffixMatches.length === 1 ? suffixMatches[0] : null;
};

// ---------------------
// QUESTS
// ---------------------

export const finishQuest = (questId, rewardItems) => {
    addItems(rewardItems);

    const gameState = loadFreshStateForMutation();
    gameState.quests[questId] = {
        ...(gameState.quests[questId] || {}),
        finished: true,
    };
    saveGameState(gameState);
};

export const questFinished = (questId) => {
    const gameState = loadGameState();
    return questFinishedInState(questId, gameState);
};

export const questFinishedInState = (questId, gameState) => {
    return Boolean(gameState?.quests?.[questId]?.finished);
};

export const getUnmetQuestRequirements = (quest) => {
    const gameState = loadGameState();
    return getUnmetQuestRequirementsInState(quest, gameState);
};

export const getUnmetQuestRequirementsInState = (quest, gameState) => {
    const requiresQuests = Array.isArray(quest?.default?.requiresQuests)
        ? quest.default.requiresQuests
        : Array.isArray(quest?.requiresQuests)
          ? quest.requiresQuests
          : [];

    return requiresQuests.filter(
        (requiredQuestId) => !questFinishedInState(requiredQuestId, gameState)
    );
};

export const canStartQuest = (quest) => {
    const gameState = loadGameState();
    return canStartQuestInState(quest, gameState);
};

export const canStartQuestInState = (quest, gameState) => {
    if (questFinishedInState(quest.id, gameState)) {
        return false;
    }

    return getUnmetQuestRequirementsInState(quest, gameState).length === 0;
};

export const setCurrentDialogueStep = (questId, stepId) => {
    const gameState = loadFreshStateForMutation();

    gameState.quests[questId] = {
        ...(gameState.quests[questId] || {}),
        stepId,
    };
    saveGameState(gameState);
};

export const getCurrentDialogueStep = (questId) => {
    const gameState = loadGameState();

    return gameState.quests[questId] ? gameState.quests[questId].stepId : 0;
};

const setItemsGranted = (questId, stepId, optionIndex) => {
    const gameState = loadFreshStateForMutation();

    const key = `${questId}-${stepId}-${optionIndex}`;
    const questProgress = gameState.quests[questId] || {};
    const claimedItems = Array.isArray(questProgress.itemsClaimed)
        ? questProgress.itemsClaimed
        : [];
    gameState.quests[questId] = {
        ...questProgress,
        stepId:
            typeof questProgress.stepId === 'string' && questProgress.stepId.length > 0
                ? questProgress.stepId
                : typeof stepId === 'string' && stepId.length > 0
                  ? stepId
                  : questProgress.stepId,
        itemsClaimed: [...claimedItems, key],
    };
    saveGameState(gameState);
};

export const getItemsGranted = (questId, stepId, optionIndex) => {
    const gameState = loadGameState();
    const key = `${questId}-${stepId}-${optionIndex}`;
    const itemsClaimed = gameState.quests?.[questId]?.itemsClaimed;

    return Array.isArray(itemsClaimed) && itemsClaimed.includes(key);
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
    const gameState = loadFreshStateForMutation();

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

const applyLegacyInProgressProcessCompensation = async (state) => {
    if (
        !state ||
        typeof state !== 'object' ||
        !state.processes ||
        typeof state.processes !== 'object'
    ) {
        return;
    }

    const processCreateItemsById = await getProcessCreateItemsById();
    state.inventory = state.inventory ?? {};
    const remainingProcesses = {};

    Object.entries(state.processes).forEach(([processId, processState]) => {
        const startedAt = Number.parseFloat(processState?.startedAt);
        const duration = Number.parseFloat(processState?.duration);
        const isInProgress =
            Number.isFinite(startedAt) && Number.isFinite(duration) && duration > 0;
        if (!isInProgress) {
            remainingProcesses[processId] = processState;
            return;
        }

        const resolvedProcessId = resolveLegacyProcessId(processId, processCreateItemsById);
        const fallbackCreateItems =
            resolvedProcessId && processCreateItemsById.has(resolvedProcessId)
                ? processCreateItemsById.get(resolvedProcessId)
                : [];
        const createItems = Array.isArray(processState?.createItemsSnapshot)
            ? processState.createItemsSnapshot
            : fallbackCreateItems;
        const hasPayout = Array.isArray(createItems) && createItems.length > 0;

        (hasPayout ? createItems : []).forEach(({ id, count }) => {
            const resolvedItem = resolveLegacyV2ItemBase(id);
            const normalizedId = resolvedItem?.v3Id ?? (UUID_REGEX.test(String(id)) ? id : null);
            const parsedCount = normalizeCount(count);
            if (!normalizedId || parsedCount <= 0) return;
            state.inventory[normalizedId] = (state.inventory[normalizedId] || 0) + parsedCount;
        });
    });

    state.processes = remainingProcesses;
};

const persistMigratedState = async (state) => {
    const migrated = validateGameState(structuredClone(state));
    migrated.versionNumberString = VERSIONS.V3;
    await saveGameState(migrated);

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

    return migrated;
};

// v1 -> v2
export const importV1V2 = (itemList) => {
    const gameState = loadFreshStateForMutation();

    const award = {
        id: EARLY_ADOPTER_ID,
        count: 1,
    };

    [award, ...itemList].forEach(({ id, count }) => {
        if (!id || !Number.isFinite(count) || count <= 0) {
            return;
        }
        gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
    });

    gameState.versionNumberString = VERSIONS.V2;
    saveGameState(gameState);
};

export const importV1V3 = async (itemList, options = {}) => {
    if (!isBrowser) return null;
    const { replaceExisting = false, currencyBalances = [] } = options;
    const { grantUpgradeTrophy } = resolveUpgradeOptions(options);

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
        if (grantUpgradeTrophy) {
            grantTrophyIfMissing(nextState, LEGACY_V2_UPGRADE_TROPHY_ID);
        }
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
    await applyLegacyInProgressProcessCompensation(normalized);
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
    await applyLegacyInProgressProcessCompensation(incoming);
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
    const hasLegacyV2Seed =
        localStorage.getItem('gameState') || localStorage.getItem('gameStateBackup');
    if (isBrowser && hasLegacyV2Seed && !localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)) {
        importV2V3();
    }
} catch {
    /* ignore */
}
