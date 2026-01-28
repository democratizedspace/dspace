import { ACHIEVEMENTS, evaluateAchievements } from './achievements.js';

const definitions = [
    {
        id: 'titles:quest-commander',
        name: 'Quest Commander',
        description: 'Reserved for captains who complete 20 quests.',
        category: 'Quest mastery',
        achievementId: 'quests:twenty',
    },
    {
        id: 'titles:power-mogul',
        name: 'Power Mogul',
        description: 'Earned by storing 10,000 dWatt in your inventory.',
        category: 'Energy leadership',
        achievementId: 'energy:mogul',
    },
    {
        id: 'titles:wind-architect',
        name: 'Wind Architect',
        description: 'Granted for installing a 500 W wind turbine.',
        category: 'Energy leadership',
        achievementId: 'equipment:wind-turbine',
    },
    {
        id: 'titles:launch-director',
        name: 'Launch Director',
        description: 'Awarded after recording five successful launches.',
        category: 'Flight command',
        achievementId: 'rocketry:flights',
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
