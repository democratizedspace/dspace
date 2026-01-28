import { ACHIEVEMENTS, evaluateAchievements } from './achievements.js';

const definitions = [
    {
        id: 'titles:mission-commander',
        name: 'Mission Commander',
        description: 'Reserved for explorers who complete twenty quests.',
        category: 'Quest mastery',
        achievementId: 'quests:twenty',
    },
    {
        id: 'titles:power-reserve',
        name: 'Power Reserve',
        description: 'Honors players who build a 2,000 dWatt safety margin.',
        category: 'Energy leadership',
        achievementId: 'energy:reserve',
    },
    {
        id: 'titles:grid-stabilizer',
        name: 'Grid Stabilizer',
        description: 'Awarded after a load-tested inverter proves your grid is steady.',
        category: 'Energy leadership',
        achievementId: 'equipment:tested-inverter',
    },
    {
        id: 'titles:launch-director',
        name: 'Launch Director',
        description: 'Given to rocketeers who establish a dedicated launchpad.',
        category: 'Rocketry',
        achievementId: 'rocketry:launchpad',
    },
    {
        id: 'titles:completionist-laureate',
        name: 'Completionist Laureate',
        description: 'A prestigious honor for earning the Completionist Award.',
        category: 'Legacy honors',
        achievementId: 'awards:completionist',
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
