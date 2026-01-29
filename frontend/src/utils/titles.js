import { ACHIEVEMENTS, evaluateAchievements } from './achievements.js';

const definitions = [
    {
        id: 'titles:quest-vanguard',
        name: 'Quest Vanguard',
        description: 'Reserved for commanders who finish thirty quests.',
        category: 'Quest mastery',
        achievementId: 'quests:thirty',
    },
    {
        id: 'titles:grid-magnate',
        name: 'Grid Magnate',
        description: 'Honors players who build a 5,000 dWatt reserve.',
        category: 'Energy leadership',
        achievementId: 'energy:stored-5000',
    },
    {
        id: 'titles:solar-architect',
        name: 'Solar Architect',
        description: 'Awarded for assembling a full 1 kWh solar setup.',
        category: 'Energy leadership',
        achievementId: 'energy:solar-array',
    },
    {
        id: 'titles:guidance-officer',
        name: 'Guidance Officer',
        description: 'Marks the completion of a guided flight stack.',
        category: 'Rocketry elite',
        achievementId: 'rocketry:guided',
    },
    {
        id: 'titles:stellar-cartographer',
        name: 'Stellar Cartographer',
        description: 'Recognizes explorers who capture a stacked star trail photo.',
        category: 'Exploration elite',
        achievementId: 'exploration:star-trails',
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
