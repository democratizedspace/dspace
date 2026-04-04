const normalizeRequiresQuests = (quest) =>
    Array.isArray(quest?.requiresQuests)
        ? quest.requiresQuests.filter((id) => typeof id === 'string' && id.trim() !== '')
        : [];

export const QUEST_STATUS = {
    UNKNOWN: 'unknown',
    LOCKED: 'locked',
    AVAILABLE: 'available',
    COMPLETED: 'completed',
};

export const classifyQuestList = ({ questSummaries = [], snapshot = null, fullState = null }) => {
    const hasAuthoritativeFullState = Boolean(fullState && typeof fullState === 'object');
    const trustedSnapshot = snapshot?.trusted ? snapshot : null;
    const completedFromSnapshot = new Set(trustedSnapshot?.completedQuestIds ?? []);
    const fullQuests = fullState?.quests ?? {};
    const completedFromFullState = new Set(
        Object.entries(fullQuests)
            .filter(([, value]) => value?.finished)
            .map(([questId]) => questId)
    );

    const completedLookup = hasAuthoritativeFullState
        ? completedFromFullState
        : completedFromSnapshot;
    const canEvaluateAvailability = hasAuthoritativeFullState || Boolean(trustedSnapshot);
    const byId = new Map(questSummaries.map((quest) => [quest.id, quest]));

    return questSummaries.map((quest) => {
        if (completedLookup.has(quest.id)) {
            return { ...quest, status: QUEST_STATUS.COMPLETED };
        }

        if (!canEvaluateAvailability) {
            return { ...quest, status: QUEST_STATUS.UNKNOWN };
        }

        const requiresQuests = normalizeRequiresQuests(quest);
        const unmet = requiresQuests.some((requirementId) => {
            if (!byId.has(requirementId)) {
                return true;
            }
            return !completedLookup.has(requirementId);
        });

        return {
            ...quest,
            status: unmet ? QUEST_STATUS.LOCKED : QUEST_STATUS.AVAILABLE,
        };
    });
};
