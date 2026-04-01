export const LEGACY_QUEST_ID_ALIASES = {
    '3dprinter/start': '3dprinting/start',
};

export const canonicalizeQuestId = (questId) => {
    if (typeof questId !== 'string') {
        return '';
    }

    const trimmedQuestId = questId.trim();
    if (!trimmedQuestId) {
        return '';
    }

    return LEGACY_QUEST_ID_ALIASES[trimmedQuestId] ?? trimmedQuestId;
};
