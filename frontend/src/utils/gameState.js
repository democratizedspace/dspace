import { loadGameState, saveGameState, validateGameState } from './gameState/common.js';
import { addItems } from './gameState/inventory.js';
import items from '../pages/inventory/json/items';

const EARLY_ADOPTER_ID = items.find((i) => i.name === 'Early Adopter Token')?.id;

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

// v2 -> v3
export const importV2V3 = async () => {
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
    if (!migrated.processes) {
        migrated.processes = {};
    }
    migrated.versionNumberString = VERSIONS.V3;
    const success = await saveGameState(migrated);

    if (success) {
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
    if (typeof window !== 'undefined' && window.localStorage?.getItem('gameState')) {
        importV2V3();
    }
} catch {
    /* ignore */
}
