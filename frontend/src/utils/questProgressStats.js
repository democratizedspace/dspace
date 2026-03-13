import { listBuiltInQuestIds } from './builtInQuests.js';

const OFFICIAL_QUEST_IDS = new Set(listBuiltInQuestIds());

export const getOfficialQuestCount = () => OFFICIAL_QUEST_IDS.size;

export const buildQuestProgressStats = (gameState) => {
    const finishedQuestIds = Object.entries(gameState?.quests || {})
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => questId);

    const completedOfficialQuestCount = finishedQuestIds.filter((questId) =>
        OFFICIAL_QUEST_IDS.has(questId)
    ).length;
    const totalOfficialQuestCount = OFFICIAL_QUEST_IDS.size;
    const remainingOfficialQuestCount = Math.max(
        totalOfficialQuestCount - completedOfficialQuestCount,
        0
    );

    return {
        completedOfficialQuestCount,
        totalOfficialQuestCount,
        remainingOfficialQuestCount,
    };
};
