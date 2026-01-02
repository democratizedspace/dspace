import { validateGameState } from './gameState/common.js';

export const META_KEY = '_meta';
export const LEGACY_LOCAL_STORAGE_KEYS = ['gameState', 'gameStateBackup'];

const cloneState = (state) => structuredClone(state ?? {});

export const hasGameProgress = (state) => {
    if (!state || typeof state !== 'object') return false;

    const hasQuests = state.quests && Object.keys(state.quests).length > 0;
    const hasInventory =
        state.inventory && Object.values(state.inventory).some((value) => Number(value) > 0);
    const hasProcesses = state.processes && Object.keys(state.processes).length > 0;

    return Boolean(hasQuests || hasInventory || hasProcesses);
};

const mergeQuestEntries = (existing = {}, incoming = {}) => {
    const merged = { ...existing };

    if (incoming.finished || existing.finished) {
        merged.finished = true;
    }

    if (
        typeof incoming.stepId === 'number' &&
        (typeof existing.stepId !== 'number' || incoming.stepId > existing.stepId)
    ) {
        merged.stepId = incoming.stepId;
    }

    const mergedClaims = new Set([
        ...(existing.itemsClaimed || []),
        ...(incoming.itemsClaimed || []),
    ]);
    if (mergedClaims.size > 0) {
        merged.itemsClaimed = Array.from(mergedClaims);
    }

    return merged;
};

export const mergeGameStates = (currentState, incomingState) => {
    const current = validateGameState(cloneState(currentState));
    const incoming = validateGameState(cloneState(incomingState));

    const merged = {
        ...current,
        quests: { ...current.quests },
        inventory: { ...current.inventory },
        processes: { ...current.processes },
        versionNumberString: current.versionNumberString ?? incoming.versionNumberString,
    };

    Object.entries(incoming.quests).forEach(([questId, questData]) => {
        merged.quests[questId] = mergeQuestEntries(current.quests[questId], questData);
    });

    Object.entries(incoming.inventory).forEach(([itemId, rawCount]) => {
        const incomingCount = Number(rawCount);
        if (!Number.isFinite(incomingCount)) return;

        const existingCount = Number(merged.inventory[itemId] || 0);
        merged.inventory[itemId] = Math.max(existingCount, incomingCount);
    });

    Object.entries(incoming.processes).forEach(([processId, processData]) => {
        merged.processes[processId] = { ...current.processes[processId], ...processData };
    });

    merged[META_KEY].lastUpdated = Math.max(
        current[META_KEY].lastUpdated ?? 0,
        incoming[META_KEY].lastUpdated ?? 0,
        Date.now()
    );

    return merged;
};

export const applyItemsToState = ({ baseState, items, versionNumber }) => {
    const next = validateGameState(cloneState(baseState));

    items.forEach(({ id, count }) => {
        const numericCount = Number(count);
        if (!id || !Number.isFinite(numericCount) || numericCount <= 0) return;
        next.inventory[id] = (next.inventory[id] || 0) + numericCount;
    });

    if (versionNumber) {
        next.versionNumberString = versionNumber;
    }

    next[META_KEY].lastUpdated = Date.now();
    return next;
};

export const normalizeStateVersion = (state, versionNumber) => {
    const normalized = validateGameState(cloneState(state));
    if (versionNumber) {
        normalized.versionNumberString = versionNumber;
    }
    normalized[META_KEY].lastUpdated = Date.now();
    return normalized;
};

export const clearLegacyLocalStorage = (
    storage = typeof localStorage !== 'undefined' ? localStorage : null
) => {
    if (!storage) return;

    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
        try {
            storage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to clear legacy localStorage key ${key}`, error);
        }
    });
};

export const readLegacyLocalStorageState = (
    storage = typeof localStorage !== 'undefined' ? localStorage : null
) => {
    if (!storage) return { state: null, error: null };

    const raw = storage.getItem('gameState');
    if (!raw) return { state: null, error: null };

    try {
        return { state: JSON.parse(raw), error: null };
    } catch (error) {
        return { state: null, error };
    }
};
