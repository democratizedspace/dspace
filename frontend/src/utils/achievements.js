import items from '../pages/inventory/json/items/index.js';

const QUEST_CATEGORY = 'Quests';
const ENERGY_CATEGORY = 'Energy';
const FABRICATION_CATEGORY = 'Fabrication';
const ROCKETRY_CATEGORY = 'Rocketry';
const SUSTAINABILITY_CATEGORY = 'Sustainability';
const EXPLORATION_CATEGORY = 'Exploration';
const OPERATIONS_CATEGORY = 'Operations';

const findItemId = (itemName) => items.find((item) => item.name === itemName)?.id;

const dWattId = findItemId('dWatt');
const portableSolarPanelId = findItemId('portable solar panel');
const solarSetupId = findItemId('Solar setup (1 kWh)');
const windTurbineId = findItemId('500 W wind turbine');
const printerId = findItemId('entry-level FDM 3D printer');
const benchyId = findItemId('Benchy');
const rocketId = findItemId('launch-capable model rocket');
const guidedStackId = findItemId('guided flight stack');
const hydroponicsKitId = findItemId('hydroponics kit');
const basilHarvestId = findItemId('bundle of basil leaves');
const aquariumId = findItemId('aquarium (150 L)');
const starTrailId = findItemId('stacked star trail photo');
const missionLogbookId = findItemId('mission logbook');

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
        description: 'Finish five quests to set your course.',
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
        title: 'Quest Navigator',
        description: 'Complete 20 quests across the DSPACE atlas.',
        category: QUEST_CATEGORY,
        goal: 20,
        unit: 'quests',
        compute: (state) => countFinishedQuests(state.quests),
    },
    {
        id: 'quests:thirty',
        title: 'Quest Vanguard',
        description: 'Finish 30 quests and become a veteran explorer.',
        category: QUEST_CATEGORY,
        goal: 30,
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
        id: 'energy:stored-2000',
        title: 'Grid Steward',
        description: 'Build a 2,000 dWatt energy reserve.',
        category: ENERGY_CATEGORY,
        goal: 2000,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
    },
    {
        id: 'energy:stored-5000',
        title: 'Grid Magnate',
        description: 'Reach a 5,000 dWatt stockpile.',
        category: ENERGY_CATEGORY,
        goal: 5000,
        unit: 'dWatt',
        requirement: { progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, dWattId),
    },
    {
        id: 'energy:solar-ready',
        title: 'Solar Scout',
        description: 'Secure a portable solar panel for field ops.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'panels',
        requirement: { itemId: portableSolarPanelId, progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, portableSolarPanelId),
    },
    {
        id: 'energy:solar-array',
        title: 'Solar Architect',
        description: 'Assemble a full 1 kWh solar setup.',
        category: ENERGY_CATEGORY,
        goal: 1,
        unit: 'arrays',
        requirement: { itemId: solarSetupId, progressItemId: dWattId },
        compute: (state) => getInventoryCount(state.inventory, solarSetupId),
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
        id: 'fabrication:printer',
        title: 'Maker Online',
        description: 'Bring an entry-level FDM 3D printer into service.',
        category: FABRICATION_CATEGORY,
        goal: 1,
        unit: 'printers',
        compute: (state) => getInventoryCount(state.inventory, printerId),
    },
    {
        id: 'fabrication:benchy',
        title: 'Calibration Captain',
        description: 'Print a Benchy to prove your setup is dialed in.',
        category: FABRICATION_CATEGORY,
        goal: 1,
        unit: 'prints',
        compute: (state) => getInventoryCount(state.inventory, benchyId),
    },
    {
        id: 'rocketry:launch',
        title: 'Launch Ready',
        description: 'Complete a launch-capable model rocket build.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'rockets',
        compute: (state) => getInventoryCount(state.inventory, rocketId),
    },
    {
        id: 'rocketry:guided',
        title: 'Guidance Officer',
        description: 'Assemble a guided flight stack for precision launches.',
        category: ROCKETRY_CATEGORY,
        goal: 1,
        unit: 'stacks',
        compute: (state) => getInventoryCount(state.inventory, guidedStackId),
    },
    {
        id: 'sustainability:hydroponics',
        title: 'Hydroponics Starter',
        description: 'Deploy your first hydroponics kit.',
        category: SUSTAINABILITY_CATEGORY,
        goal: 1,
        unit: 'kits',
        compute: (state) => getInventoryCount(state.inventory, hydroponicsKitId),
    },
    {
        id: 'sustainability:harvest',
        title: 'Green Thumb',
        description: 'Harvest a bundle of basil leaves from your grow.',
        category: SUSTAINABILITY_CATEGORY,
        goal: 1,
        unit: 'bundles',
        compute: (state) => getInventoryCount(state.inventory, basilHarvestId),
    },
    {
        id: 'exploration:aquarium',
        title: 'Aquarium Architect',
        description: 'Set up a 150 L aquarium habitat.',
        category: EXPLORATION_CATEGORY,
        goal: 1,
        unit: 'aquariums',
        compute: (state) => getInventoryCount(state.inventory, aquariumId),
    },
    {
        id: 'exploration:star-trails',
        title: 'Stellar Cartographer',
        description: 'Capture a stacked star trail photo.',
        category: EXPLORATION_CATEGORY,
        goal: 1,
        unit: 'photos',
        compute: (state) => getInventoryCount(state.inventory, starTrailId),
    },
    {
        id: 'operations:logbook',
        title: 'Mission Recorder',
        description: 'Open a mission logbook to track your progress.',
        category: OPERATIONS_CATEGORY,
        goal: 1,
        unit: 'logbooks',
        compute: (state) => getInventoryCount(state.inventory, missionLogbookId),
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
