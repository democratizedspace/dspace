const DEFAULT_DIALOGUE = [
    {
        id: 'start',
        text: 'This custom quest ends immediately.',
        options: [
            {
                type: 'finish',
                text: 'Finish quest',
            },
        ],
    },
];

const DEFAULT_IMAGE = '/assets/quests/howtodoquests.jpg';
const DEFAULT_NPC = '/assets/npc/dChat.jpg';

export function normalizeQuest(rawQuest) {
    if (!rawQuest) {
        return null;
    }

    const questData = rawQuest.default ?? rawQuest;
    if (!questData || !questData.id) {
        return null;
    }

    const dialogue =
        Array.isArray(questData.dialogue) && questData.dialogue.length > 0
            ? questData.dialogue
            : DEFAULT_DIALOGUE;

    const start = questData.start ?? dialogue[0]?.id ?? 'start';

    const rewards = Array.isArray(questData.rewards) ? questData.rewards : [];

    const requiresQuests = Array.isArray(questData.requiresQuests)
        ? questData.requiresQuests.filter((id) => typeof id === 'string' && id.trim() !== '')
        : [];

    return {
        ...questData,
        id: questData.id,
        title: questData.title ?? 'Untitled Quest',
        description: questData.description ?? '',
        image: questData.image || DEFAULT_IMAGE,
        npc: questData.npc || DEFAULT_NPC,
        start,
        dialogue,
        rewards,
        requiresQuests,
    };
}
