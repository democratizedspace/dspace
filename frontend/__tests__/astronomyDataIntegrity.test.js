const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const Ajv = require('ajv');

const questIds = [
    'astronomy/aurora-watch.json',
    'astronomy/iss-flyover.json',
    'astronomy/constellations.json',
    'astronomy/north-star.json',
    'astronomy/venus-phases.json',
];

const questsRoot = path.join(__dirname, '../src/pages/quests/json');
const processes = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/pages/processes/base.json'), 'utf8')
);
const processIds = new Set(processes.map((p) => p.id));

const itemIds = new Set();
for (const file of globSync(path.join(__dirname, '../src/pages/inventory/json/items/**/*.json'))) {
    const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
    contents.forEach((item) => itemIds.add(item.id));
}

function collectProcessesFromQuest(quest) {
    const ids = [];
    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (option.process) ids.push(option.process);
        }
    }
    return ids;
}

function collectItemsFromProcess(process) {
    return [
        ...(process.requireItems ?? []),
        ...(process.consumeItems ?? []),
        ...(process.createItems ?? []),
    ].map((entry) => entry.id);
}

describe('astronomy quest data integrity', () => {
    const schema = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../src/pages/quests/jsonSchemas/quest.json'), 'utf8')
    );
    const validate = new Ajv().compile(schema);

    test('quests parse and match the quest schema', () => {
        for (const questPath of questIds) {
            const quest = JSON.parse(fs.readFileSync(path.join(questsRoot, questPath), 'utf8'));
            const valid = validate(quest);
            if (!valid) {
                throw new Error(
                    `${quest.id} failed schema validation: ${JSON.stringify(validate.errors)}`
                );
            }
        }
    });

    test('quests reference existing processes', () => {
        for (const questPath of questIds) {
            const quest = JSON.parse(fs.readFileSync(path.join(questsRoot, questPath), 'utf8'));
            for (const processId of collectProcessesFromQuest(quest)) {
                expect(processIds.has(processId)).toBe(true);
            }
        }
    });

    test('processes reference existing items', () => {
        for (const process of processes) {
            for (const itemId of collectItemsFromProcess(process)) {
                expect(itemIds.has(itemId)).toBe(true);
            }
        }
    });
});
