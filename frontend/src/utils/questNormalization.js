import { applyQuestDefaults } from './questDefaults.js';

export function normalizeQuest(rawQuest) {
    const resolvedQuest = rawQuest?.default ?? rawQuest;

    if (!resolvedQuest || resolvedQuest.id == null) {
        return null;
    }

    const baseQuest = applyQuestDefaults(resolvedQuest);
    const rewards = Array.isArray(resolvedQuest.rewards) ? resolvedQuest.rewards : [];

    return {
        ...baseQuest,
        rewards,
    };
}
