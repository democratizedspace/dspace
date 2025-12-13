import items from '../pages/inventory/json/items/index.js';

const QUEST_CATEGORY = 'Quests';
const ENERGY_CATEGORY = 'Energy';

const findItemId = (itemName) => items.find((item) => item.name === itemName)?.id;

const dWattId = findItemId('dWatt');
const windTurbineId = findItemId('500 W wind turbine');

const toSafeNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const formatProgress = (current, target, unit) => {
    if (!target || target <= 0) {
        return unit ? `0 ${unit}` : '0';
    }
    const base = `${current} / ${target}`;
    return unit ? `${base} ${unit}` : base;
};

const countFinishedQuests = (quests) =>
    Object.values(quests || {}).reduce((total, quest) => (quest?.finished ? total + 1 : total), 0);

const getInventoryCount = (inventory, itemId) => {
    if (!itemId) return 0;
    return toSafeNumber(inventory?.[itemId] ?? 0);
};

const definitions = [
    {
        id: 'quests:first',
        title: 'First Steps',
        description: 'Complete your first quest.',
        category: QUEST_CATEGORY,
        goal: 1,
        unit: 'quests',
        compute: (state) => countFinishedQuests(state.quests),
    },
    {
        id: 'quests:ten',
        title: 'Mission Specialist',
        description: 'Finish 10 quests to prove your dedication.',
        category: QUEST_CATEGORY,
        goal: 10,
        unit: 'quests',
        compute: (state) => countFinishedQuests(state.quests),
    },
    {
        id: 'energy:stored',
        title: 'Energy Investor',
        description: 'Store 500 dWatt across your inventory.',
        category: ENERGY_CATEGORY,
        goal: 500,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
    },
    {
        id: 'equipment:wind-turbine',
        title: 'Wind Pioneer',
        description: 'Add a 500 W wind turbine to your base.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'turbines',
        requirement: { itemId: windTurbineId, progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, windTurbineId),
    },
];

export const ACHIEVEMENTS = definitions.map(({ compute, ...rest }) => Object.freeze({ ...rest }));

export const evaluateAchievements = (rawState = {}) => {
    const state = {
        quests: rawState.quests ?? {},
        inventory: rawState.inventory ?? {},
        processes: rawState.processes ?? {},
    };

    return definitions.map(({ compute, goal, unit, ...rest }) => {
        const current = toSafeNumber(compute(state));
        const target = goal;
        const clamped = target > 0 ? Math.min(current, target) : current;
        const percent = target > 0 ? Math.min(100, Math.round((clamped / target) * 100)) : 100;

        return {
            ...rest,
            goal,
            unit,
            progress: {
                current,
                target,
                percent,
                displayValue: formatProgress(current, target, unit),
            },
            unlocked: current >= target,
        };
    });
};
