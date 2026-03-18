import { describe, expect, it } from 'vitest';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};

const CAPSTONE_QUEST_ID = 'completionist/award-iii';
const AWARD_III_ITEM_ID = 'adf69f8d-4b30-4eec-b667-43ff5dfd9892';

const PROCESS_SEQUENCE = [
    'print-completionist-iii-modules',
    'mill-completionist-iii-wood-base',
    'solder-completionist-iii-harness',
    'integrate-completionist-iii-robotics',
    'assemble-completionist-iii-planter',
    'assemble-completionist-award-iii',
] as const;

const toSet = (values: string[]) => new Set(values);

describe('completionist award III launch-gate semantics', () => {
    it('locks the capstone behind the full pre-capstone terminal quest set', async () => {
        const quests = await loadQuests();
        const capstone = quests.find((quest: any) => quest.id === CAPSTONE_QUEST_ID);
        expect(capstone).toBeDefined();

        // INTENT: Completionist Award III must require every pre-capstone "leaf" quest
        // (a quest that no other pre-capstone quest depends on). This deliberately
        // couples the capstone gate to the full quest graph so adding a new standalone
        // quest requires an explicit product decision about capstone inclusion.
        const preCapstoneQuests = quests.filter((quest: any) => quest.id !== CAPSTONE_QUEST_ID);
        const dependedUpon = new Set<string>();

        for (const quest of preCapstoneQuests) {
            for (const requiredQuestId of quest.requiresQuests ?? []) {
                dependedUpon.add(requiredQuestId);
            }
        }

        const terminalQuestIds = preCapstoneQuests
            .map((quest: any) => quest.id)
            .filter((questId: string) => !dependedUpon.has(questId))
            .sort();

        expect(toSet(capstone.requiresQuests ?? [])).toEqual(toSet(terminalQuestIds));
        expect(terminalQuestIds.length).toBeGreaterThan(0);
    });

    it('keeps the process chain viable in the intended sequence', async () => {
        const processById = new Map(processes.map((process) => [process.id, process]));
        const quests = await loadQuests();
        const capstone = quests.find((quest: any) => quest.id === CAPSTONE_QUEST_ID);
        expect(capstone).toBeDefined();

        const processOptions = (capstone.dialogue ?? []).flatMap((node: any) =>
            (node.options ?? [])
                .filter((option: any) => option.type === 'process')
                .map((option: any) => option.process)
        );

        expect(processOptions).toEqual(PROCESS_SEQUENCE);

        for (const processId of PROCESS_SEQUENCE) {
            expect(processById.has(processId), `missing process ${processId}`).toBe(true);
        }

        const printModules = processById.get('print-completionist-iii-modules');
        const millWood = processById.get('mill-completionist-iii-wood-base');
        const solderHarness = processById.get('solder-completionist-iii-harness');
        const integrateRobotics = processById.get('integrate-completionist-iii-robotics');
        const assemblePlanter = processById.get('assemble-completionist-iii-planter');
        const assembleAward = processById.get('assemble-completionist-award-iii');

        expect(printModules?.createItems).toContainEqual({
            id: 'be9cb892-f4b2-45fd-ae2b-34d3190acb59',
            count: 1,
        });
        expect(millWood?.createItems).toContainEqual({
            id: 'fd54da0d-cf87-4860-bf74-df3be8a95f90',
            count: 1,
        });
        expect(solderHarness?.createItems).toContainEqual({
            id: '37f159f8-e8a2-4721-9608-c4b25855092e',
            count: 1,
        });
        expect(integrateRobotics?.requireItems).toEqual(
            expect.arrayContaining([
                { id: 'be9cb892-f4b2-45fd-ae2b-34d3190acb59', count: 1 },
                { id: '37f159f8-e8a2-4721-9608-c4b25855092e', count: 1 },
            ])
        );
        expect(integrateRobotics?.createItems).toContainEqual({
            id: 'e6f5d8eb-1ce2-4a91-b9f4-3bbac465018b',
            count: 1,
        });
        expect(assemblePlanter?.requireItems).toContainEqual({
            id: 'e6f5d8eb-1ce2-4a91-b9f4-3bbac465018b',
            count: 1,
        });
        expect(assemblePlanter?.createItems).toContainEqual({
            id: 'ba8cc7ec-f6c9-429a-aa7d-4bf8f513f4c9',
            count: 1,
        });
        expect(assembleAward?.requireItems).toEqual(
            expect.arrayContaining([
                { id: 'fd54da0d-cf87-4860-bf74-df3be8a95f90', count: 1 },
                { id: 'ba8cc7ec-f6c9-429a-aa7d-4bf8f513f4c9', count: 1 },
            ])
        );
        expect(assembleAward?.createItems).toContainEqual({ id: AWARD_III_ITEM_ID, count: 1 });
    });

    it('grants exactly one Completionist Award III reward and has a clean finish path', async () => {
        const quests = await loadQuests();
        const capstone = quests.find((quest: any) => quest.id === CAPSTONE_QUEST_ID);
        expect(capstone).toBeDefined();

        expect(capstone.rewards).toEqual([{ id: AWARD_III_ITEM_ID, count: 1 }]);

        const finalAssemblyNode = (capstone.dialogue ?? []).find(
            (node: any) => node.id === 'final-assembly'
        );
        expect(finalAssemblyNode).toBeDefined();
        expect(finalAssemblyNode.options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'process', process: 'assemble-completionist-award-iii' }),
                expect.objectContaining({
                    type: 'goto',
                    goto: 'finish',
                    requiresItems: [{ id: AWARD_III_ITEM_ID, count: 1 }],
                }),
            ])
        );

        const finishNode = (capstone.dialogue ?? []).find((node: any) => node.id === 'finish');
        expect(finishNode).toBeDefined();
        expect((finishNode.options ?? []).some((option: any) => option.type === 'finish')).toBe(true);
    });
});
