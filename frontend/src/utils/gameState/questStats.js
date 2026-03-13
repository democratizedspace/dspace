import { listBuiltInQuestIds } from '../builtInQuests.js';

export const getOfficialQuestStats = (gameState, options = {}) => {
    const questIds =
        Array.isArray(options.officialQuestIds) && options.officialQuestIds.length
            ? options.officialQuestIds
            : listBuiltInQuestIds();
    const officialQuestIds = new Set(questIds.filter((id) => typeof id === 'string' && id));

    const completedQuestCount = Object.entries(gameState?.quests || {}).reduce(
        (count, [questId, questState]) => {
            if (!questState?.finished) {
                return count;
            }
            return officialQuestIds.has(questId) ? count + 1 : count;
        },
        0
    );
    const totalOfficialQuestCount = officialQuestIds.size;
    const remainingOfficialQuestCount = Math.max(totalOfficialQuestCount - completedQuestCount, 0);

    return {
        completedQuestCount,
        totalOfficialQuestCount,
        remainingOfficialQuestCount,
    };
};
