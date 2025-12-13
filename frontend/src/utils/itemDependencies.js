// Using import assertions for JSON imports
import itemQuestMap from '../generated/itemQuestMap.json' assert { type: 'json' };

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
