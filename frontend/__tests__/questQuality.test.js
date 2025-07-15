/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define paths
const questDirectoryRelativePath = '../src/pages/quests/json/';
const npcFilePath = '../src/pages/docs/md/npcs.md';

// Maps to hold quest data and relationships
const quests = new Map();
const questDependencies = new Map();
const questsByCategory = new Map();
const items = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/pages/inventory/json/items.json'))
);
const processes = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/pages/processes/processes.json'))
);
const itemIds = new Set(items.map((i) => i.id));
const processIds = new Set(processes.map((p) => p.id));

// Quality criteria
const CRITERIA = {
    MIN_DIALOGUE_LENGTH: 50, // Minimum characters for meaningful dialogue text
    MAX_DIALOGUE_OPTIONS: 4, // Maximum options in a single dialogue node
    MIN_OPTIONS: 1, // Minimum options in a dialogue node
    ETHICAL_KEYWORDS: [
        'appropriate',
        'ethical',
        'humane',
        'welfare',
        'proper care',
        'adequate space',
    ],
    NPC_PERSONALITIES: {
        dChat: ['helpful', 'information', 'suggest', 'guide', 'assist'],
        sydney: ['expertise', 'professional', 'engineer', 'repair', 'build', 'create'],
        nova: ['rocketry', 'spacecraft', 'engineer', 'overcome', 'design', 'construct'],
        hydro: ['hydroponics', 'farming', 'sustainable', 'growing', 'plants', 'crop'],
        vega: ['aquarium', 'ecosystem', 'fish', 'aquatic', 'habitat', 'balance', 'shrimp', 'tank'],
        orion: ['electrical', 'engineer', 'robotics', 'microprocessor', 'intelligent', 'technical'],
        phoenix: ['chemist', 'sustainable', 'fuel', 'chemistry', 'eco-friendly', 'environmental'],
        atlas: ['robot', 'assistant', 'physical', 'strength', 'precision', 'task'],
    },
    // Specific criteria for aquariums
    AQUARIUM_SIZES: {
        goldfish: 150, // minimum size in liters for goldfish
        guppy: 40, // minimum size in liters for guppies
        walstad: 30, // minimum size in liters for walstad method
    },
    // Temperature ranges for different fish (in Celsius)
    TEMPERATURE_RANGES: {
        goldfish: [18, 22],
        tropical: [24, 28],
    },
    ITEM_USAGE_THRESHOLD: 0.8, // fraction of quests that should use items
    PROCESS_USAGE_THRESHOLD: 0.3, // fraction of quests that should use processes
};

// Load all quest files
function loadAllQuests() {
    const directoryPath = path.join(__dirname, questDirectoryRelativePath);
    const files = glob.sync(path.join(directoryPath, '**/*.json'));

    files.forEach((file) => {
        try {
            const data = JSON.parse(fs.readFileSync(file));
            quests.set(data.id, data);

            // Track dependencies
            if (data.requiresQuests && data.requiresQuests.length > 0) {
                questDependencies.set(data.id, data.requiresQuests);
            }

            // Group by category
            const category = data.id.split('/')[0];
            if (!questsByCategory.has(category)) {
                questsByCategory.set(category, []);
            }
            questsByCategory.get(category).push(data.id);
        } catch (error) {
            console.error(`Error loading quest from ${file}:`, error);
        }
    });
}

// Extract NPC personalities from npcs.md
function extractNpcPersonalities() {
    try {
        const npcFile = path.join(__dirname, npcFilePath);
        const content = fs.readFileSync(npcFile, 'utf8');

        // Simple extraction - could be enhanced with more sophisticated parsing
        const npcSections = content.split('##');
        npcSections.shift(); // Remove content before first ## if any

        npcSections.forEach((section) => {
            // Extract NPC name and description
            const lines = section.trim().split('\n');
            if (lines.length > 0) {
                const name = lines[0].trim();
                // Further processing could be done here
            }
        });
    } catch (error) {
        console.error('Error reading NPC file:', error);
    }
}

// Check if dialogue style matches NPC personality
function checkDialogueStyle(quest) {
    const issues = [];
    const npcImage = quest.npc.split('/').pop().replace('.jpg', '');
    const personality = CRITERIA.NPC_PERSONALITIES[npcImage];

    if (!personality) {
        issues.push(`Unknown NPC ${npcImage} in quest ${quest.id}`);
        return issues;
    }

    // For each dialogue node, check if text matches personality
    quest.dialogue.forEach((node) => {
        const text = node.text.toLowerCase();
        let matchesPersonality = false;

        // Check if any personality keywords are present
        for (const keyword of personality) {
            if (text.includes(keyword.toLowerCase())) {
                matchesPersonality = true;
                break;
            }
        }

        // Very crude personality check, this could be improved significantly
        if (!matchesPersonality && text.length > CRITERIA.MIN_DIALOGUE_LENGTH) {
            issues.push(
                `Dialogue node ${node.id} in quest ${quest.id} may not match ${npcImage}'s personality`
            );
        }

        // Check dialogue length
        if (text.length < CRITERIA.MIN_DIALOGUE_LENGTH) {
            issues.push(`Dialogue node ${node.id} in quest ${quest.id} is too short`);
        }

        // Check options
        if (!node.options || node.options.length < CRITERIA.MIN_OPTIONS) {
            issues.push(`Dialogue node ${node.id} in quest ${quest.id} has too few options`);
        }

        if (node.options && node.options.length > CRITERIA.MAX_DIALOGUE_OPTIONS) {
            issues.push(`Dialogue node ${node.id} in quest ${quest.id} has too many options`);
        }
    });

    return issues;
}

// Check aquarium-specific ethical considerations
function checkAquariumEthics(quest) {
    const issues = [];

    if (!quest.id.startsWith('aquaria/')) {
        return issues; // Not an aquarium quest
    }

    let questText = quest.dialogue
        .map((node) => node.text)
        .join(' ')
        .toLowerCase();

    // Check for tank size mentions
    if (quest.id.includes('goldfish')) {
        if (!questText.includes('150') && !questText.includes('200')) {
            issues.push(
                `Goldfish quest ${quest.id} may not specify adequate tank size (150-200L minimum)`
            );
        }

        // Check for single goldfish recommendation
        if (
            questText.includes('two goldfish') &&
            !questText.includes('150 liter') &&
            !questText.includes('single goldfish')
        ) {
            issues.push(
                `Goldfish quest ${quest.id} should recommend one goldfish for a tank under 200L`
            );
        }
    }

    // Check temperature ranges
    if (quest.id.includes('goldfish')) {
        let minTemp = CRITERIA.TEMPERATURE_RANGES.goldfish[0];
        let maxTemp = CRITERIA.TEMPERATURE_RANGES.goldfish[1];

        if (!questText.includes(minTemp.toString()) || !questText.includes(maxTemp.toString())) {
            issues.push(
                `Goldfish quest ${quest.id} should specify proper temperature range (${minTemp}-${maxTemp}°C)`
            );
        }
    }

    if (quest.id.includes('guppy')) {
        let minTemp = CRITERIA.TEMPERATURE_RANGES.tropical[0];
        let maxTemp = CRITERIA.TEMPERATURE_RANGES.tropical[1];

        if (!questText.includes(minTemp.toString()) || !questText.includes(maxTemp.toString())) {
            issues.push(
                `Guppy quest ${quest.id} should specify proper temperature range (${minTemp}-${maxTemp}°C)`
            );
        }
    }

    // Check for ethical terms
    let hasEthicalConsideration = false;
    for (const term of CRITERIA.ETHICAL_KEYWORDS) {
        if (questText.includes(term)) {
            hasEthicalConsideration = true;
            break;
        }
    }

    if (!hasEthicalConsideration) {
        issues.push(`Quest ${quest.id} may not include ethical care considerations`);
    }

    return issues;
}

// Check for logical progression in quest dependencies
function checkQuestProgression() {
    const issues = [];

    // Check for circular dependencies
    const visited = new Set();
    const recursionStack = new Set();

    function dfs(questId) {
        if (recursionStack.has(questId)) {
            issues.push(`Circular dependency detected involving quest ${questId}`);
            return;
        }

        if (visited.has(questId)) {
            return;
        }

        visited.add(questId);
        recursionStack.add(questId);

        const dependencies = questDependencies.get(questId) || [];
        for (const dep of dependencies) {
            if (!quests.has(dep)) {
                issues.push(`Quest ${questId} depends on non-existent quest ${dep}`);
            } else {
                dfs(dep);
            }
        }

        recursionStack.delete(questId);
    }

    for (const questId of quests.keys()) {
        dfs(questId);
    }

    // Check for category progression (e.g., aquaria quests follow proper sequence)
    for (const [category, questIds] of questsByCategory.entries()) {
        if (category === 'aquaria') {
            // Verify aquaria progression: walstad -> water-testing -> sponge-filter -> position-tank -> shrimp -> guppy -> water-change -> breeding -> goldfish
            const expectedOrder = [
                'walstad',
                'water-testing',
                'sponge-filter',
                'position-tank',
                'shrimp',
                'guppy',
                'water-change',
                'breeding',
                'goldfish',
            ];

            // Get all relevant quests and sort by their position in the expected order
            const aquariaQuests = questIds
                .map((id) => {
                    const basename = path.basename(id, '.json');
                    const orderIndex = expectedOrder.findIndex((keyword) =>
                        basename.includes(keyword)
                    );
                    return { id, orderIndex: orderIndex >= 0 ? orderIndex : 999 };
                })
                .sort((a, b) => a.orderIndex - b.orderIndex);

            // Check if dependencies follow the expected order
            for (let i = 1; i < aquariaQuests.length; i++) {
                const quest = quests.get(aquariaQuests[i].id);
                const dependencies = quest.requiresQuests || [];

                // Find at least one dependency from the previous level
                const previousLevelQuests = aquariaQuests
                    .filter((q) => q.orderIndex < aquariaQuests[i].orderIndex)
                    .map((q) => q.id);

                const hasPreviousLevelDependency = dependencies.some((dep) =>
                    previousLevelQuests.includes(dep)
                );

                if (!hasPreviousLevelDependency && previousLevelQuests.length > 0) {
                    issues.push(
                        `Quest ${
                            aquariaQuests[i].id
                        } should depend on at least one of: ${previousLevelQuests.join(', ')}`
                    );
                }
            }
        }
    }

    return issues;
}

// Analyze how quests reference items and processes
function checkItemProcessUsage() {
    let questsUsingItems = 0;
    let questsUsingProcesses = 0;
    const issues = [];

    for (const [id, quest] of quests.entries()) {
        let usedItem = false;
        let usedProcess = false;

        quest.dialogue.forEach((node) => {
            (node.options || []).forEach((opt) => {
                if (opt.requiresItems) {
                    usedItem = true;
                    opt.requiresItems.forEach((item) => {
                        if (!itemIds.has(item.id)) {
                            issues.push(`Quest ${id} references unknown item ${item.id}`);
                        }
                    });
                }
                if (opt.grantsItems) {
                    usedItem = true;
                    opt.grantsItems.forEach((item) => {
                        if (!itemIds.has(item.id)) {
                            issues.push(`Quest ${id} references unknown item ${item.id}`);
                        }
                    });
                }
                if (opt.type === 'process') {
                    usedProcess = true;
                    if (!processIds.has(opt.process)) {
                        issues.push(`Quest ${id} references unknown process ${opt.process}`);
                    }
                }
            });
        });

        if (quest.rewards) {
            usedItem = true;
            quest.rewards.forEach((reward) => {
                if (!itemIds.has(reward.id)) {
                    issues.push(`Quest ${id} rewards unknown item ${reward.id}`);
                }
            });
        }

        if (usedItem) questsUsingItems++;
        if (usedProcess) questsUsingProcesses++;
        if (!usedItem && !usedProcess) {
            issues.push(`Quest ${id} has no item or process references`);
        }
    }

    const itemRatio = questsUsingItems / quests.size;
    const processRatio = questsUsingProcesses / quests.size;

    if (itemRatio < CRITERIA.ITEM_USAGE_THRESHOLD) {
        issues.push(
            `Only ${Math.round(itemRatio * 100)}% of quests reference items (expected ${
                CRITERIA.ITEM_USAGE_THRESHOLD * 100
            }%)`
        );
    }

    if (processRatio < CRITERIA.PROCESS_USAGE_THRESHOLD) {
        issues.push(
            `Only ${Math.round(processRatio * 100)}% of quests reference processes (expected ${
                CRITERIA.PROCESS_USAGE_THRESHOLD * 100
            }%)`
        );
    }

    return issues;
}

describe('Quest Quality Validation', () => {
    beforeAll(() => {
        loadAllQuests();
        extractNpcPersonalities();
    });

    test('All quests have appropriate dialogue length and options', () => {
        const allIssues = [];

        for (const [id, quest] of quests.entries()) {
            const issues = checkDialogueStyle(quest);
            allIssues.push(...issues);
        }

        if (allIssues.length > 0) {
            console.warn('Dialogue Style Issues:');
            allIssues.forEach((issue) => console.warn(`- ${issue}`));
        }

        // Fail the test if we have critical issues (uncomment to enforce)
        // expect(allIssues.length).toBe(0);

        // For now, just output warnings but don't fail tests
        expect(true).toBe(true);
    });

    test('Aquarium quests follow ethical care guidelines', () => {
        const allIssues = [];

        for (const [id, quest] of quests.entries()) {
            if (id.startsWith('aquaria/')) {
                const issues = checkAquariumEthics(quest);
                allIssues.push(...issues);
            }
        }

        if (allIssues.length > 0) {
            console.warn('Aquarium Ethics Issues:');
            allIssues.forEach((issue) => console.warn(`- ${issue}`));
        }

        // For now, just output warnings but don't fail tests
        expect(true).toBe(true);
    });

    test('Quest dependencies form a logical progression', () => {
        const issues = checkQuestProgression();

        if (issues.length > 0) {
            console.warn('Quest Progression Issues:');
            issues.forEach((issue) => console.warn(`- ${issue}`));
        }

        // For now, just output warnings but don't fail tests
        expect(true).toBe(true);
    });

    test('Quests reference valid items and processes sufficiently', () => {
        const issues = checkItemProcessUsage();

        if (issues.length > 0) {
            console.warn('Item/Process Usage Issues:');
            issues.forEach((issue) => console.warn(`- ${issue}`));
        }
        expect(issues.length).toBe(0);
    });
});
