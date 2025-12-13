const questModules = import.meta.glob('../pages/quests/json/*/*.json', {
    eager: true,
});

const questsById = new Map();

for (const moduleExport of Object.values(questModules)) {
    const quest = moduleExport?.default ?? moduleExport;
    if (!quest || typeof quest.id !== 'string') {
        continue;
    }
    questsById.set(quest.id, quest);
}

function cloneQuest(quest) {
    if (typeof structuredClone === 'function') {
        return structuredClone(quest);
    }
    return JSON.parse(JSON.stringify(quest));
}

export function getBuiltInQuest(id) {
    if (!questsById.has(id)) {
        return null;
    }

    const quest = questsById.get(id);
    return quest ? cloneQuest(quest) : null;
}

export function listBuiltInQuestIds() {
    return Array.from(questsById.keys());
}
