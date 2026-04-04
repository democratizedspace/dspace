export const QUEST_LIST_STATUS = {
    UNKNOWN: 'unknown',
    LOCKED: 'locked',
    AVAILABLE: 'available',
    COMPLETED: 'completed',
};

const normalizeRequires = (quest) => {
    if (Array.isArray(quest?.requiresQuests)) {
        return quest.requiresQuests.filter((id) => typeof id === 'string' && id.trim() !== '');
    }
    if (Array.isArray(quest?.default?.requiresQuests)) {
        return quest.default.requiresQuests.filter(
            (id) => typeof id === 'string' && id.trim() !== ''
        );
    }
    return [];
};

const buildCompletedSetFromSnapshot = (snapshot) => {
    if (!snapshot?.isAuthoritative || !Array.isArray(snapshot.completedQuestIds)) {
        return null;
    }

    return new Set(snapshot.completedQuestIds);
};

const buildCompletedSetFromState = (fullState) => {
    if (!fullState?.quests || typeof fullState.quests !== 'object') {
        return null;
    }

    const completedIds = [];
    for (const [questId, progress] of Object.entries(fullState.quests)) {
        if (progress?.finished) {
            completedIds.push(questId);
        }
    }

    return new Set(completedIds);
};

export const classifyQuestList = ({ quests = [], snapshot = null, fullState = null } = {}) => {
    const authoritativeCompletedSet =
        buildCompletedSetFromState(fullState) ?? buildCompletedSetFromSnapshot(snapshot);

    return quests.map((quest) => {
        const requiresQuests = normalizeRequires(quest);

        if (!authoritativeCompletedSet) {
            return {
                ...quest,
                requiresQuests,
                status: QUEST_LIST_STATUS.UNKNOWN,
                statusAuthoritative: false,
            };
        }

        if (authoritativeCompletedSet.has(quest.id)) {
            return {
                ...quest,
                requiresQuests,
                status: QUEST_LIST_STATUS.COMPLETED,
                statusAuthoritative: true,
            };
        }

        const unmetRequirements = requiresQuests.filter(
            (requiredQuestId) => !authoritativeCompletedSet.has(requiredQuestId)
        );

        return {
            ...quest,
            requiresQuests,
            status:
                unmetRequirements.length === 0
                    ? QUEST_LIST_STATUS.AVAILABLE
                    : QUEST_LIST_STATUS.LOCKED,
            statusAuthoritative: true,
        };
    });
};
