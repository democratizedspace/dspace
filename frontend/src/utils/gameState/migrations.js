import items from '../../pages/inventory/json/items';
import { VERSIONS } from '../gameState.js';
import { validateGameState } from './common.js';

const EARLY_ADOPTER_ID = items.find((item) => item.name === 'Early Adopter Token')?.id;

export const determineStateVersion = (state) => {
    if (!state || typeof state !== 'object') return 'unknown';

    if (state.versionNumberString === VERSIONS.V1) return 'v1';
    if (state.versionNumberString === VERSIONS.V2) return 'v2';
    if (state.versionNumberString === VERSIONS.V3) return 'v3';

    if (state._meta) return 'v3';

    return 'v2';
};

export const stateHasContent = (state) => {
    if (!state || typeof state !== 'object') return false;

    const quests = state.quests && Object.keys(state.quests).length > 0;
    const inventory = state.inventory && Object.values(state.inventory).some((count) => count > 0);
    const processes = state.processes && Object.keys(state.processes).length > 0;

    return Boolean(quests || inventory || processes);
};

export const normalizeToV3State = (state) => {
    const normalized = validateGameState(structuredClone(state ?? {}));
    normalized.versionNumberString = VERSIONS.V3;
    return normalized;
};

export const mergeGameStates = (currentState, legacyState) => {
    const base = normalizeToV3State(currentState);
    const legacy = normalizeToV3State(legacyState);
    const merged = structuredClone(base);

    Object.entries(legacy.inventory ?? {}).forEach(([id, count]) => {
        const safeCount = Number(count) || 0;
        merged.inventory[id] = (merged.inventory[id] || 0) + safeCount;
    });

    const questIds = new Set([
        ...Object.keys(legacy.quests ?? {}),
        ...Object.keys(merged.quests ?? {}),
    ]);

    questIds.forEach((questId) => {
        const incoming = legacy.quests?.[questId];
        const existing = merged.quests?.[questId];

        if (!incoming) return;

        if (!existing) {
            merged.quests[questId] = structuredClone(incoming);
            return;
        }

        const mergedQuest = { ...existing };
        const currentItems = Array.isArray(existing.itemsClaimed) ? existing.itemsClaimed : [];
        const incomingItems = Array.isArray(incoming.itemsClaimed) ? incoming.itemsClaimed : [];

        if (incoming.finished || existing.finished) {
            mergedQuest.finished = true;
        }

        const currentStep = typeof existing.stepId === 'number' ? existing.stepId : 0;
        const incomingStep = typeof incoming.stepId === 'number' ? incoming.stepId : 0;
        const maxStep = Math.max(currentStep, incomingStep);
        if (maxStep > 0) {
            mergedQuest.stepId = maxStep;
        }

        const combinedItems = Array.from(new Set([...currentItems, ...incomingItems]));
        if (combinedItems.length > 0) {
            mergedQuest.itemsClaimed = combinedItems;
        }

        merged.quests[questId] = mergedQuest;
    });

    const mergedProcesses = { ...merged.processes };
    Object.entries(legacy.processes ?? {}).forEach(([processId, value]) => {
        const currentValue = mergedProcesses[processId];
        if (typeof currentValue === 'number' && typeof value === 'number') {
            mergedProcesses[processId] = Math.max(currentValue, value);
            return;
        }

        if (currentValue === undefined) {
            mergedProcesses[processId] = value;
        }
    });
    merged.processes = mergedProcesses;

    merged.versionNumberString = VERSIONS.V3;
    return merged;
};

export const buildV1InventoryState = (itemsFromCookies) => {
    const inventory = {};
    (itemsFromCookies || []).forEach(({ id, count }) => {
        if (!id) return;
        const safeCount = Number(count) || 0;
        if (safeCount <= 0) return;
        inventory[id] = (inventory[id] || 0) + safeCount;
    });

    if (EARLY_ADOPTER_ID) {
        inventory[EARLY_ADOPTER_ID] = (inventory[EARLY_ADOPTER_ID] || 0) + 1;
    }

    return normalizeToV3State({
        quests: {},
        inventory,
        processes: {},
        versionNumberString: VERSIONS.V1,
    });
};
