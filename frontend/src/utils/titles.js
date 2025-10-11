import { ACHIEVEMENTS, evaluateAchievements } from './achievements.js';

const definitions = [
    {
        id: 'titles:rookie-explorer',
        name: 'Rookie Explorer',
        description: 'Awarded for completing your first quest.',
        category: 'Quest mastery',
        achievementId: 'quests:first',
    },
    {
        id: 'titles:mission-specialist',
        name: 'Mission Specialist',
        description: 'Granted once you finish ten quests across any storyline.',
        category: 'Quest mastery',
        achievementId: 'quests:ten',
    },
    {
        id: 'titles:grid-investor',
        name: 'Grid Investor',
        description: 'Recognizes players who store at least 500 dWatt in their inventory.',
        category: 'Energy leadership',
        achievementId: 'energy:stored',
    },
    {
        id: 'titles:wind-pioneer',
        name: 'Wind Pioneer',
        description: 'Celebrates the installation of a 500 W wind turbine at your base.',
        category: 'Energy leadership',
        achievementId: 'equipment:wind-turbine',
    },
];

const achievementDefinitionsById = new Map(
    ACHIEVEMENTS.map((achievement) => [achievement.id, achievement])
);

const toProgressSummary = (achievement) => {
    if (!achievement) {
        return {
            current: 0,
            target: 0,
            percent: 0,
            displayValue: '0',
        };
    }

    return {
        current: achievement.progress.current,
        target: achievement.progress.target,
        percent: achievement.progress.percent,
        displayValue: achievement.progress.displayValue,
    };
};

export const TITLES = Object.freeze(
    definitions.map(({ achievementId, ...rest }) => Object.freeze({ ...rest, achievementId }))
);

export const evaluateTitles = (rawState = {}) => {
    const achievementSummaries = evaluateAchievements(rawState);
    const achievementsById = new Map(
        achievementSummaries.map((achievement) => [achievement.id, achievement])
    );

    return definitions.map(({ achievementId, ...rest }) => {
        const achievement = achievementsById.get(achievementId);
        const definition = achievementDefinitionsById.get(achievementId);
        const goal = definition?.goal ?? achievement?.progress.target ?? 0;

        return {
            ...rest,
            achievementId,
            goal,
            progress: toProgressSummary(achievement),
            unlocked: Boolean(achievement?.unlocked),
        };
    });
};
