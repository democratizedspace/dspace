import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const QUEST_ID = 'completionist/award-iii';
const AWARD_III_ID = 'adf69f8d-4b30-4eec-b667-43ff5dfd9892';

const PROCESS_SEQUENCE = [
    'print-completionist-iii-modules',
    'mill-completionist-iii-wood-base',
    'solder-completionist-iii-harness',
    'integrate-completionist-iii-robotics',
    'assemble-completionist-iii-planter',
    'assemble-completionist-award-iii',
] as const;

const STEP_GATE_ITEMS = [
    'be9cb892-f4b2-45fd-ae2b-34d3190acb59',
    'fd54da0d-cf87-4860-bf74-df3be8a95f90',
    '37f159f8-e8a2-4721-9608-c4b25855092e',
    'e6f5d8eb-1ce2-4a91-b9f4-3bbac465018b',
    'ba8cc7ec-f6c9-429a-aa7d-4bf8f513f4c9',
    AWARD_III_ID,
] as const;

const CHAIN_CREATED_ITEMS = [
    'be9cb892-f4b2-45fd-ae2b-34d3190acb59',
    'fd54da0d-cf87-4860-bf74-df3be8a95f90',
    '37f159f8-e8a2-4721-9608-c4b25855092e',
    'e6f5d8eb-1ce2-4a91-b9f4-3bbac465018b',
    'ba8cc7ec-f6c9-429a-aa7d-4bf8f513f4c9',
    AWARD_III_ID,
] as const;

function resolveRepoPath(...parts: string[]) {
    const cwd = process.cwd();
    const asFrontendWorkspace = path.join(cwd, ...parts);
    if (fs.existsSync(asFrontendWorkspace)) {
        return asFrontendWorkspace;
    }

    return path.join(cwd, 'frontend', ...parts);
}

function readJson(...parts: string[]) {
    const filePath = resolveRepoPath(...parts);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

type QuestJson = {
    id: string;
    requiresQuests?: string[];
    dialogue: Array<{ id: string; options: Array<Record<string, unknown>> }>;
    rewards: Array<{ id: string; count: number }>;
};

function walkQuestJsonFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walkQuestJsonFiles(entryPath);
        }
        return entryPath.endsWith('.json') ? [entryPath] : [];
    });
}

describe('completionist award III launch gate', () => {
    it('locks capstone behind the full pre-capstone DAG leaf set', () => {
        const questsDir = resolveRepoPath('src', 'pages', 'quests', 'json');
        const questFiles = walkQuestJsonFiles(questsDir);
        const quests = new Map<string, QuestJson>();

        for (const filePath of questFiles) {
            const quest = JSON.parse(fs.readFileSync(filePath, 'utf8')) as QuestJson;
            quests.set(quest.id, quest);
        }

        const dependents = new Map<string, Set<string>>();
        for (const questId of quests.keys()) {
            dependents.set(questId, new Set());
        }

        for (const quest of quests.values()) {
            for (const dependency of quest.requiresQuests ?? []) {
                if (!dependents.has(dependency) || quest.id === QUEST_ID) {
                    continue;
                }
                dependents.get(dependency)?.add(quest.id);
            }
        }

        const preCapstoneLeaves = [...dependents.entries()]
            .filter(([questId, requiring]) => questId !== QUEST_ID && requiring.size === 0)
            .map(([questId]) => questId)
            .sort();

        const awardQuest = quests.get(QUEST_ID);
        const requiredForUnlock = [...(awardQuest?.requiresQuests ?? [])].sort();

        expect(requiredForUnlock).toEqual(preCapstoneLeaves);
        expect(requiredForUnlock.length).toBeGreaterThan(0);
    });

    it('enforces the intended process and item-gate sequence', () => {
        const quest = readJson('src', 'pages', 'quests', 'json', 'completionist', 'award-iii.json');
        const dialogueById = new Map(quest.dialogue.map((step: { id: string }) => [step.id, step]));

        const stageIds = [
            'print-modules',
            'wood-base',
            'electronics-harness',
            'robotics-integration',
            'planter-integration',
            'final-assembly',
        ];

        stageIds.forEach((stageId, index) => {
            const stage = dialogueById.get(stageId);
            expect(stage).toBeDefined();

            const processOption = stage.options.find(
                (option: { type: string }) => option.type === 'process'
            );
            const gotoOption = stage.options.find(
                (option: { type: string }) => option.type === 'goto'
            );

            expect(processOption?.process).toBe(PROCESS_SEQUENCE[index]);
            expect(gotoOption?.requiresItems).toEqual([{ id: STEP_GATE_ITEMS[index], count: 1 }]);
        });

        const finishStep = dialogueById.get('finish');
        expect(finishStep?.options).toEqual([
            { type: 'finish', text: 'Claim the Completionist Award III' },
        ]);
    });

    it('keeps the process chain viable in both base and generated process catalogs', () => {
        const catalogs = [
            readJson('src', 'pages', 'processes', 'base.json'),
            readJson('src', 'generated', 'processes.json'),
        ];

        for (const catalog of catalogs) {
            PROCESS_SEQUENCE.forEach((processId, index) => {
                const process = catalog.find((entry: { id: string }) => entry.id === processId);
                expect(process).toBeDefined();
                expect(process.createItems).toEqual([{ id: CHAIN_CREATED_ITEMS[index], count: 1 }]);
            });

            const integrate = catalog.find(
                (entry: { id: string }) => entry.id === 'integrate-completionist-iii-robotics'
            );
            expect(integrate?.requireItems).toEqual(
                expect.arrayContaining([
                    { id: CHAIN_CREATED_ITEMS[0], count: 1 },
                    { id: CHAIN_CREATED_ITEMS[2], count: 1 },
                ])
            );
            expect(integrate?.consumeItems).toEqual(
                expect.arrayContaining([
                    { id: CHAIN_CREATED_ITEMS[0], count: 1 },
                    { id: CHAIN_CREATED_ITEMS[2], count: 1 },
                ])
            );

            const planter = catalog.find(
                (entry: { id: string }) => entry.id === 'assemble-completionist-iii-planter'
            );
            expect(planter?.requireItems).toContainEqual({ id: CHAIN_CREATED_ITEMS[3], count: 1 });
            expect(planter?.consumeItems).toContainEqual({ id: CHAIN_CREATED_ITEMS[3], count: 1 });

            const finalAssembly = catalog.find(
                (entry: { id: string }) => entry.id === 'assemble-completionist-award-iii'
            );
            expect(finalAssembly?.requireItems).toEqual(
                expect.arrayContaining([
                    { id: CHAIN_CREATED_ITEMS[1], count: 1 },
                    { id: CHAIN_CREATED_ITEMS[4], count: 1 },
                ])
            );
            expect(finalAssembly?.consumeItems).toEqual(
                expect.arrayContaining([
                    { id: CHAIN_CREATED_ITEMS[1], count: 1 },
                    { id: CHAIN_CREATED_ITEMS[4], count: 1 },
                ])
            );
        }
    });

    it('rewards exactly one Completionist Award III on quest completion', () => {
        const quest = readJson('src', 'pages', 'quests', 'json', 'completionist', 'award-iii.json');
        expect(quest.rewards).toEqual([{ id: AWARD_III_ID, count: 1 }]);
    });
});
