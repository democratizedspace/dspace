import { applyQuestDefaults } from './questDefaults.js';

export function normalizeQuest(rawQuest) {
    if (!rawQuest || rawQuest.id == null) {
        return null;
    }

    const baseQuest = applyQuestDefaults(rawQuest);
    const rewards = Array.isArray(rawQuest.rewards) ? rawQuest.rewards : [];

    return {
        ...baseQuest,
        rewards,
    };
}
