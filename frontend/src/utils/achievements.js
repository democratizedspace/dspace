import items from '../pages/inventory/json/items/index.js';

const QUEST_CATEGORY = 'Quests';
const ENERGY_CATEGORY = 'Energy';
const ROCKETRY_CATEGORY = 'Rocketry';
const HYDROPONICS_CATEGORY = 'Hydroponics';
const AQUARIUM_CATEGORY = 'Aquarium';

const findItemId = (itemName) => items.find((item) => item.name === itemName)?.id;

const dWattId = findItemId('dWatt');
const dCarbonId = findItemId('dCarbon');
const dOffsetId = findItemId('dOffset');
const dLaunchId = findItemId('dLaunch');
const windTurbineId = findItemId('500 W wind turbine');
const solarPanelId = findItemId('portable solar panel');
const solarKitId = findItemId('portable solar kit (wired)');
const rocketPrintId = findItemId('3D printed model rocket');
const rocketLaunchpadId = findItemId('Model rocket launchpad');
const rocketLaunchReadyId = findItemId('launch-capable model rocket');
const hydroponicsKitId = findItemId('hydroponics kit');
const hydroponicLampId = findItemId('hydroponic grow lamp');
const basilBundleId = findItemId('bundle of basil leaves');
const aquariumId = findItemId('aquarium (150 L)');

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
        id: 'quests:five',
        title: 'Quest Scout',
        description: 'Finish 5 quests across any quest line.',
        category: QUEST_CATEGORY,
        goal: 5,
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
        id: 'quests:twenty',
        title: 'Quest Commander',
        description: 'Complete 20 quests across the map.',
        category: QUEST_CATEGORY,
        goal: 20,
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
        id: 'energy:banker',
        title: 'Power Banker',
        description: 'Bank 2,000 dWatt in storage.',
        category: ENERGY_CATEGORY,
        goal: 2000,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
    },
    {
        id: 'energy:mogul',
        title: 'Power Mogul',
        description: 'Amass 10,000 dWatt in storage.',
        category: ENERGY_CATEGORY,
        goal: 10000,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
    },
    {
        id: 'energy:carbon-counter',
        title: 'Carbon Counter',
        description: 'Collect 100 dCarbon.',
        category: ENERGY_CATEGORY,
        goal: 100,
        unit: 'dCarbon',
        requirement: { progressItemId: dCarbonId },
        compute: (state) => getInventoryCount(state.inventory, dCarbonId),
    },
    {
        id: 'energy:offset-advocate',
        title: 'Offset Advocate',
        description: 'Earn 25 dOffset through carbon reductions.',
        category: ENERGY_CATEGORY,
        goal: 25,
        unit: 'dOffset',
        requirement: { progressItemId: dOffsetId },
        compute: (state) => getInventoryCount(state.inventory, dOffsetId),
    },
    {
        id: 'equipment:solar-panel',
        title: 'Solar Starter',
        description: 'Add a portable solar panel to your gear.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'panel',
        requirement: { itemId: solarPanelId, progressItemId: solarPanelId },
        compute: (state) => getInventoryCount(state.inventory, solarPanelId),
    },
    {
        id: 'equipment:solar-kit',
        title: 'Solar Operator',
        description: 'Wire up a portable solar kit.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'kit',
        requirement: { itemId: solarKitId, progressItemId: solarKitId },
        compute: (state) => getInventoryCount(state.inventory, solarKitId),
    },
    {
        id: 'equipment:wind-turbine',
        title: 'Wind Pioneer',
        description: 'Add a 500 W wind turbine to your base.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'turbine',
        requirement: { itemId: windTurbineId, progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, windTurbineId),
    },
    {
        id: 'rocketry:printed',
        title: 'Print the Rocket',
        description: 'Build a 3D printed model rocket.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'rocket',
        requirement: { itemId: rocketPrintId, progressItemId: rocketPrintId },
        compute: (state) => getInventoryCount(state.inventory, rocketPrintId),
    },
    {
        id: 'rocketry:launchpad',
        title: 'Launch Director',
        description: 'Set up a model rocket launchpad.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'launchpad',
        requirement: { itemId: rocketLaunchpadId, progressItemId: rocketLaunchpadId },
        compute: (state) => getInventoryCount(state.inventory, rocketLaunchpadId),
    },
    {
        id: 'rocketry:launch-ready',
        title: 'Flight Ready',
        description: 'Assemble a launch-capable model rocket.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'rocket',
        requirement: { itemId: rocketLaunchReadyId, progressItemId: rocketLaunchReadyId },
        compute: (state) => getInventoryCount(state.inventory, rocketLaunchReadyId),
    },
    {
        id: 'rocketry:flights',
        title: 'Flight Log',
        description: 'Record 5 successful launches.',
        category: ROCKETRY_CATEGORY,
        goal: 5,
        unit: 'launches',
        requirement: { progressItemId: dLaunchId },
        compute: (state) => getInventoryCount(state.inventory, dLaunchId),
    },
    {
        id: 'hydroponics:starter',
        title: 'Hydroponics Starter',
        description: 'Acquire a hydroponics kit.',
        category: HYDROPONICS_CATEGORY,
        goal: 1,
        unit: 'kit',
        requirement: { itemId: hydroponicsKitId, progressItemId: hydroponicsKitId },
        compute: (state) => getInventoryCount(state.inventory, hydroponicsKitId),
    },
    {
        id: 'hydroponics:grow-light',
        title: 'Photosynthesis Crew',
        description: 'Install a hydroponic grow lamp.',
        category: HYDROPONICS_CATEGORY,
        goal: 1,
        unit: 'lamp',
        requirement: { itemId: hydroponicLampId, progressItemId: hydroponicLampId },
        compute: (state) => getInventoryCount(state.inventory, hydroponicLampId),
    },
    {
        id: 'hydroponics:harvest',
        title: 'Basil Harvest',
        description: 'Collect a bundle of basil leaves.',
        category: HYDROPONICS_CATEGORY,
        goal: 1,
        unit: 'bundle',
        requirement: { itemId: basilBundleId, progressItemId: basilBundleId },
        compute: (state) => getInventoryCount(state.inventory, basilBundleId),
    },
    {
        id: 'aquarium:keeper',
        title: 'Aquarium Keeper',
        description: 'Set up your first 150 L aquarium.',
        category: AQUARIUM_CATEGORY,
        goal: 1,
        unit: 'aquarium',
        requirement: { itemId: aquariumId, progressItemId: aquariumId },
        compute: (state) => getInventoryCount(state.inventory, aquariumId),
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
