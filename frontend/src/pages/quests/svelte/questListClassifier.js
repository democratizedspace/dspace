const UNKNOWN_STATUS = 'unknown';
const LOCKED_STATUS = 'locked';
const AVAILABLE_STATUS = 'available';
const COMPLETED_STATUS = 'completed';
const IN_PROGRESS_STATUS = 'in-progress';

const normalizeQuestSummary = (quest) => {
    if (!quest || typeof quest !== 'object') {
        return null;
    }

    const id = typeof quest.id === 'string' ? quest.id.trim() : '';
    if (!id) {
        return null;
    }

    const requiresQuests = Array.isArray(quest.requiresQuests)
        ? quest.requiresQuests.filter((entry) => typeof entry === 'string' && entry.trim())
        : [];

    return {
        ...quest,
        id,
        requiresQuests,
    };
};

const toSet = (entries = []) => {
    const next = new Set();
    for (const entry of entries) {
        if (typeof entry === 'string' && entry.trim()) {
            next.add(entry.trim());
        }
    }
    return next;
};

export const QUEST_LIST_STATUSES = {
    UNKNOWN: UNKNOWN_STATUS,
    LOCKED: LOCKED_STATUS,
    AVAILABLE: AVAILABLE_STATUS,
    COMPLETED: COMPLETED_STATUS,
    IN_PROGRESS: IN_PROGRESS_STATUS,
};

export const buildClassifierInputFromState = (stateValue) => {
    const quests =
        stateValue?.quests && typeof stateValue.quests === 'object' ? stateValue.quests : {};
    const completedQuestIds = [];
    const inProgressQuestIds = [];

    Object.entries(quests).forEach(([questId, progress]) => {
        if (!progress || typeof progress !== 'object') {
            return;
        }

        if (progress.finished) {
            completedQuestIds.push(questId);
            return;
        }

        if (typeof progress.stepId === 'string' && progress.stepId.trim()) {
            inProgressQuestIds.push(questId);
        }
    });

    return {
        authoritative: true,
        completedQuestIds,
        inProgressQuestIds,
    };
};

export const classifyQuestList = (questSummaries = [], options = {}) => {
    const authoritative = Boolean(options.authoritative);
    const completedQuestIds = toSet(options.completedQuestIds);
    const inProgressQuestIds = toSet(options.inProgressQuestIds);

    return questSummaries.reduce((accumulator, entry) => {
        const quest = normalizeQuestSummary(entry);
        if (!quest) {
            return accumulator;
        }

        let status = UNKNOWN_STATUS;

        if (authoritative) {
            if (completedQuestIds.has(quest.id)) {
                status = COMPLETED_STATUS;
            } else if (inProgressQuestIds.has(quest.id)) {
                status = IN_PROGRESS_STATUS;
            } else {
                const hasUnmetRequirements = quest.requiresQuests.some(
                    (requiredQuestId) => !completedQuestIds.has(requiredQuestId)
                );
                status = hasUnmetRequirements ? LOCKED_STATUS : AVAILABLE_STATUS;
            }
        }

        accumulator.push({
            quest,
            status,
            isCompleted: status === COMPLETED_STATUS,
        });
        return accumulator;
    }, []);
};
