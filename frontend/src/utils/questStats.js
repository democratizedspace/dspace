import { listBuiltInQuestIds } from './builtInQuests.js';

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeOfficialQuestIds = (questIds) =>
    Array.from(
        new Set(
            (Array.isArray(questIds) ? questIds : [])
                .map((questId) => (typeof questId === 'string' ? questId.trim() : ''))
                .filter(Boolean)
        )
    );

export const computeOfficialQuestStats = (gameState, options = {}) => {
    const officialQuestIds = normalizeOfficialQuestIds(
        options.officialQuestIds ?? listBuiltInQuestIds()
    );
    const officialQuestSet = new Set(officialQuestIds);
    const questsState = isPlainObject(gameState?.quests) ? gameState.quests : {};

    let completedQuestCount = 0;
    for (const questId of officialQuestSet) {
        if (questsState[questId]?.finished) {
            completedQuestCount += 1;
        }
    }

    const totalOfficialQuestCount = officialQuestSet.size;
    const remainingOfficialQuestCount = Math.max(totalOfficialQuestCount - completedQuestCount, 0);

    return {
        completedQuestCount,
        totalOfficialQuestCount,
        remainingOfficialQuestCount,
    };
};
