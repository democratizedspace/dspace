import { applyQuestDefaults } from './questDefaults.js';

export function normalizeQuestForChat(rawQuest) {
    if (!rawQuest) {
        return null;
    }

    const questData = rawQuest.default ?? rawQuest;
    if (!questData || !questData.id) {
        return null;
    }

    const defaults = applyQuestDefaults(questData);
    const rewards = Array.isArray(questData.rewards) ? questData.rewards : [];

    return {
        ...questData,
        ...defaults,
        rewards,
        requiresQuests: defaults.requiresQuests,
    };
}
