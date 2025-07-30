import itemQuestMap from '../generated/itemQuestMap.json';

export function getQuestsForItem(itemId) {
    const entry = itemQuestMap[itemId];
    if (!entry) {
        return { requires: [], rewards: [] };
    }
    return {
        requires: entry.requires || [],
        rewards: entry.rewards || [],
    };
}
