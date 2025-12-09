const DEFAULT_QUEST_IMAGE = '/assets/quests/howtodoquests.jpg';
const DEFAULT_NPC_NAME = 'Mission Control';
const DEFAULT_DIALOGUE_NODE_ID = 'start';
const DEFAULT_DIALOGUE_TEXT = 'This custom quest ends immediately.';
const DEFAULT_DIALOGUE_OPTION = { type: 'finish', text: 'Finish quest' };

function cloneDefaultOption(option = DEFAULT_DIALOGUE_OPTION) {
    return { ...option };
}

function createDefaultDialogueNode(id = DEFAULT_DIALOGUE_NODE_ID) {
    return {
        id,
        text: DEFAULT_DIALOGUE_TEXT,
        options: [cloneDefaultOption()],
    };
}

export function applyQuestDefaults(partial = {}) {
    const sanitizedTitle = typeof partial.title === 'string' ? partial.title.trim() : '';
    const sanitizedDescription =
        typeof partial.description === 'string' ? partial.description.trim() : '';
    const sanitizedNpc = typeof partial.npc === 'string' ? partial.npc.trim() : '';
    const sanitizedStart = typeof partial.start === 'string' ? partial.start.trim() : '';

    const providedDialogue = Array.isArray(partial.dialogue) ? partial.dialogue : [];
    const dialogue = providedDialogue.length > 0 ? providedDialogue : [createDefaultDialogueNode()];

    const start = dialogue.some((node) => node?.id === sanitizedStart)
        ? sanitizedStart
        : dialogue[0]?.id ?? DEFAULT_DIALOGUE_NODE_ID;

    const requiresQuests = Array.isArray(partial.requiresQuests)
        ? partial.requiresQuests.filter((id) => typeof id === 'string' && id.trim() !== '')
        : [];

    const imageCandidate = typeof partial.image === 'string' ? partial.image.trim() : '';
    const image = imageCandidate || DEFAULT_QUEST_IMAGE;

    return {
        ...partial,
        title: sanitizedTitle,
        description: sanitizedDescription,
        image,
        npc: sanitizedNpc || DEFAULT_NPC_NAME,
        dialogue,
        start,
        requiresQuests,
    };
}

export {
    DEFAULT_DIALOGUE_NODE_ID,
    DEFAULT_DIALOGUE_OPTION,
    DEFAULT_DIALOGUE_TEXT,
    DEFAULT_NPC_NAME,
    DEFAULT_QUEST_IMAGE,
    createDefaultDialogueNode,
};
