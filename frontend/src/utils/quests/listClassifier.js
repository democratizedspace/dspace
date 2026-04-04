const normalizeQuestIdList = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean);
};

export const buildCompletedQuestIdSet = (snapshot = {}) => {
    if (snapshot?.authoritative && Array.isArray(snapshot.completedQuestIds)) {
        return new Set(normalizeQuestIdList(snapshot.completedQuestIds));
    }

    const questEntries = snapshot?.state?.quests;
    if (!questEntries || typeof questEntries !== 'object') {
        return new Set();
    }

    return new Set(
        Object.entries(questEntries)
            .filter(([, progress]) => Boolean(progress?.finished))
            .map(([questId]) => questId)
    );
};

export const classifyQuestList = ({ quests = [], snapshot = {} } = {}) => {
    const completedQuestIds = buildCompletedQuestIdSet(snapshot);
    const authoritative = Boolean(snapshot?.authoritative) || Boolean(snapshot?.state);

    return quests.map((quest) => {
        const requiresQuests = normalizeQuestIdList(quest?.requiresQuests);

        if (completedQuestIds.has(quest.id)) {
            return { ...quest, status: 'completed' };
        }

        if (!authoritative) {
            return { ...quest, status: 'unknown' };
        }

        const canStart = requiresQuests.every((requiredQuestId) =>
            completedQuestIds.has(requiredQuestId)
        );
        return { ...quest, status: canStart ? 'available' : 'locked' };
    });
};
