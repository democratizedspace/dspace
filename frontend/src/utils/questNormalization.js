import { applyQuestDefaults } from './questDefaults.js';

const DEFAULT_CUSTOM_NPC = '/assets/npc/dChat.jpg';

export function normalizeQuest(rawQuest) {
    if (!rawQuest || rawQuest.id == null) {
        return null;
    }

    const quest = applyQuestDefaults(rawQuest);
    const npcValue = typeof rawQuest.npc === 'string' ? rawQuest.npc.trim() : '';

    return {
        ...quest,
        npc: npcValue || DEFAULT_CUSTOM_NPC,
        rewards: Array.isArray(quest.rewards) ? quest.rewards : [],
        requiresQuests: Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [],
    };
}
