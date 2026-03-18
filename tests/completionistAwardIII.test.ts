import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

type ItemCount = { id: string; count: number };
type QuestOption = {
    type?: string;
    process?: string;
    requiresItems?: ItemCount[];
};
type QuestNode = { id?: string; options?: QuestOption[] };
type QuestData = {
    id: string;
    rewards?: ItemCount[];
    requiresQuests?: string[];
    dialogue?: QuestNode[];
};
type ProcessData = {
    id: string;
    requireItems?: ItemCount[];
    consumeItems?: ItemCount[];
    createItems?: ItemCount[];
};

const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');
const QUEST_PATH = path.join(
    process.cwd(),
    'frontend/src/pages/quests/json/completionist/award-iii.json'
);
const PROCESSES_PATH = path.join(process.cwd(), 'frontend/src/pages/processes/base.json');
const CAPSTONE_QUEST_ID = 'completionist/award-iii';
const AWARD_III_ITEM_ID = 'adf69f8d-4b30-4eec-b667-43ff5dfd9892';

const processSequence = [
    'print-completionist-iii-modules',
    'mill-completionist-iii-wood-base',
    'solder-completionist-iii-harness',
    'integrate-completionist-iii-robotics',
    'assemble-completionist-iii-planter',
    'assemble-completionist-award-iii',
];

const readFileTree = async (dir: string): Promise<string[]> => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await readFileTree(fullPath)));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath);
        }
    }

    return files;
};

const loadAllQuests = async (): Promise<QuestData[]> => {
    const questPaths = await readFileTree(QUESTS_DIR);
    return Promise.all(
        questPaths.map(async (questPath) => {
            const raw = await readFile(questPath, 'utf8');
            return JSON.parse(raw) as QuestData;
        })
    );
};

const loadAwardQuest = async (): Promise<QuestData> => {
    const raw = await readFile(QUEST_PATH, 'utf8');
    return JSON.parse(raw) as QuestData;
};

const getProcessOptionIds = (quest: QuestData) =>
    (quest.dialogue ?? []).flatMap((node) =>
        (node.options ?? [])
            .filter((option) => option.type === 'process' && typeof option.process === 'string')
            .map((option) => option.process as string)
    );

describe('completionist award iii launch gate', () => {
    it('locks on the complete pre-capstone leaf set and unlocks only when all are completed', async () => {
        const quests = await loadAllQuests();
        const awardQuest = quests.find((quest) => quest.id === CAPSTONE_QUEST_ID);
        expect(awardQuest).toBeTruthy();

        const dependents = new Map<string, Set<string>>();
        for (const quest of quests) {
            for (const prerequisite of quest.requiresQuests ?? []) {
                if (!dependents.has(prerequisite)) {
                    dependents.set(prerequisite, new Set<string>());
                }
                dependents.get(prerequisite)?.add(quest.id);
            }
        }

        const preCapstoneLeaves = quests
            .filter((quest) => quest.id !== CAPSTONE_QUEST_ID)
            .filter((quest) => {
                const deps = dependents.get(quest.id);
                if (!deps || deps.size === 0) return true;
                return [...deps].every((id) => id === CAPSTONE_QUEST_ID);
            })
            .map((quest) => quest.id)
            .sort();

        const requiredLeafSet = [...(awardQuest?.requiresQuests ?? [])].sort();
        expect(requiredLeafSet).toEqual(preCapstoneLeaves);

        const completedAll = new Set(requiredLeafSet);
        const unlockedWithAllPrereqs = requiredLeafSet.every((id) => completedAll.has(id));
        expect(unlockedWithAllPrereqs).toBe(true);

        const completedMissingOne = new Set(requiredLeafSet.slice(1));
        const unlockedMissingOne = requiredLeafSet.every((id) => completedMissingOne.has(id));
        expect(unlockedMissingOne).toBe(false);
    });

    it('uses the exact required process sequence, finishes cleanly, and rewards exactly one Completionist Award III', async () => {
        const [awardQuest, processesRaw] = await Promise.all([
            loadAwardQuest(),
            readFile(PROCESSES_PATH, 'utf8'),
        ]);

        const processes = JSON.parse(processesRaw) as ProcessData[];
        const processById = new Map(processes.map((process) => [process.id, process]));

        expect(getProcessOptionIds(awardQuest)).toEqual(processSequence);

        const chainOutputIds = new Set<string>();
        for (const processId of processSequence) {
            const process = processById.get(processId);
            expect(process).toBeTruthy();
            expect(process?.createItems?.length ?? 0).toBeGreaterThanOrEqual(1);
            for (const created of process?.createItems ?? []) {
                chainOutputIds.add(created.id);
            }
        }

        const inventory = new Map<string, number>();
        const apply = (items: ItemCount[] = [], sign = 1) => {
            for (const entry of items) {
                inventory.set(
                    entry.id,
                    (inventory.get(entry.id) ?? 0) + Number(entry.count ?? 0) * sign
                );
            }
        };

        for (const processId of processSequence) {
            const process = processById.get(processId) as ProcessData;

            for (const requirement of [...(process.requireItems ?? []), ...(process.consumeItems ?? [])]) {
                const needed = Number(requirement.count ?? 0);
                const existing = inventory.get(requirement.id) ?? 0;
                if (!chainOutputIds.has(requirement.id) && existing < needed) {
                    inventory.set(requirement.id, needed);
                }
            }

            for (const requirement of process.requireItems ?? []) {
                expect(inventory.get(requirement.id) ?? 0).toBeGreaterThanOrEqual(
                    Number(requirement.count ?? 0)
                );
            }

            for (const consumed of process.consumeItems ?? []) {
                expect(inventory.get(consumed.id) ?? 0).toBeGreaterThanOrEqual(Number(consumed.count ?? 0));
            }

            apply(process.consumeItems, -1);
            apply(process.createItems, 1);
        }

        expect(inventory.get(AWARD_III_ITEM_ID) ?? 0).toBeGreaterThanOrEqual(1);

        const reward = awardQuest.rewards ?? [];
        expect(reward).toEqual([{ id: AWARD_III_ITEM_ID, count: 1 }]);

        const finalDialogueNode = (awardQuest.dialogue ?? []).find((node) => node.id === 'finish');
        const finishOptions = finalDialogueNode?.options ?? [];
        expect(finishOptions.some((option) => option.type === 'finish')).toBe(true);
    });
});
