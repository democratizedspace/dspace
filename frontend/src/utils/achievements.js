import items from '../pages/inventory/json/items/index.js';

const QUEST_CATEGORY = 'Quests';
const ENERGY_CATEGORY = 'Energy';
const FABRICATION_CATEGORY = 'Fabrication';
const ROCKETRY_CATEGORY = 'Rocketry';
const HYDROPONICS_CATEGORY = 'Hydroponics';
const AWARDS_CATEGORY = 'Awards';

const findItemId = (itemName) => items.find((item) => item.name === itemName)?.id;

const dWattId = findItemId('dWatt');
const windTurbineId = findItemId('500 W wind turbine');
const solarPanelId = findItemId('portable solar panel');
const batteryPackId = findItemId('200 Wh battery pack');
const solarKitId = findItemId('portable solar kit (wired)');
const mountedInverterId = findItemId('mounted 300 W inverter');
const testedInverterId = findItemId('load-tested inverter');
const printerId = findItemId('entry-level FDM 3D printer');
const benchyId = findItemId('Benchy');
const modelRocketId = findItemId('3D printed model rocket');
const launchpadId = findItemId('Model rocket launchpad');
const hydroponicsKitId = findItemId('hydroponics kit');
const nutrientId = findItemId('hydroponic nutrient concentrate (1 L)');
const completionistAwardId = findItemId('Completionist Award');

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
        title: 'Trailblazer',
        description: 'Finish five quests across any storyline.',
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
        description: 'Complete 20 quests and lead the expedition.',
        category: QUEST_CATEGORY,
        goal: 20,
        unit: 'quests',
        compute: (state) => countFinishedQuests(state.quests),
    },
    {
        id: 'energy:starter',
        title: 'Charge Collector',
        description: 'Store 100 dWatt in your inventory.',
        category: ENERGY_CATEGORY,
        goal: 100,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
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
        id: 'energy:reserve',
        title: 'Power Reserve',
        description: 'Build a 2,000 dWatt emergency reserve.',
        category: ENERGY_CATEGORY,
        goal: 2000,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
    },
    {
        id: 'equipment:solar-panel',
        title: 'Solar Scout',
        description: 'Install a portable solar panel.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'panels',
        requirement: { itemId: solarPanelId },
        compute: (state) => getInventoryCount(state.inventory, solarPanelId),
    },
    {
        id: 'equipment:battery-pack',
        title: 'Battery Steward',
        description: 'Secure a 200 Wh battery pack for storage.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'packs',
        requirement: { itemId: batteryPackId },
        compute: (state) => getInventoryCount(state.inventory, batteryPackId),
    },
    {
        id: 'equipment:solar-kit',
        title: 'Field Ready',
        description: 'Assemble a wired portable solar kit.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'kits',
        requirement: { itemId: solarKitId },
        compute: (state) => getInventoryCount(state.inventory, solarKitId),
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
    {
        id: 'equipment:mounted-inverter',
        title: 'AC Uplink',
        description: 'Mount a 300 W inverter safely.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'inverters',
        requirement: { itemId: mountedInverterId },
        compute: (state) => getInventoryCount(state.inventory, mountedInverterId),
    },
    {
        id: 'equipment:tested-inverter',
        title: 'Grid Stable',
        description: 'Load-test an inverter and confirm stable output.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'inverters',
        requirement: { itemId: testedInverterId },
        compute: (state) => getInventoryCount(state.inventory, testedInverterId),
    },
    {
        id: 'fabrication:printer',
        title: 'Printer Online',
        description: 'Bring an entry-level FDM 3D printer online.',
        category: FABRICATION_CATEGORY,
        goal: 1,
        unit: 'printers',
        requirement: { itemId: printerId },
        compute: (state) => getInventoryCount(state.inventory, printerId),
    },
    {
        id: 'fabrication:benchy',
        title: 'Calibration Captain',
        description: 'Print a Benchy calibration model.',
        category: FABRICATION_CATEGORY,
        goal: 1,
        unit: 'prints',
        requirement: { itemId: benchyId },
        compute: (state) => getInventoryCount(state.inventory, benchyId),
    },
    {
        id: 'rocketry:printed-rocket',
        title: 'Rocket Crafter',
        description: 'Print your first model rocket airframe.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'rockets',
        requirement: { itemId: modelRocketId },
        compute: (state) => getInventoryCount(state.inventory, modelRocketId),
    },
    {
        id: 'rocketry:launchpad',
        title: 'Pad Builder',
        description: 'Set up a dedicated model rocket launchpad.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'pads',
        requirement: { itemId: launchpadId },
        compute: (state) => getInventoryCount(state.inventory, launchpadId),
    },
    {
        id: 'hydroponics:starter',
        title: 'Green Initiate',
        description: 'Establish your first hydroponics kit.',
        category: HYDROPONICS_CATEGORY,
        goal: 1,
        unit: 'kits',
        requirement: { itemId: hydroponicsKitId },
        compute: (state) => getInventoryCount(state.inventory, hydroponicsKitId),
    },
    {
        id: 'hydroponics:nutrients',
        title: 'Nutrient Steward',
        description: 'Stock 1 L of hydroponic nutrient concentrate.',
        category: HYDROPONICS_CATEGORY,
        goal: 1,
        unit: 'bottles',
        requirement: { itemId: nutrientId },
        compute: (state) => getInventoryCount(state.inventory, nutrientId),
    },
    {
        id: 'awards:completionist',
        title: 'Completionist',
        description: 'Earn the Completionist Award trophy.',
        category: AWARDS_CATEGORY,
        goal: 1,
        unit: 'awards',
        requirement: { itemId: completionistAwardId },
        compute: (state) => getInventoryCount(state.inventory, completionistAwardId),
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
