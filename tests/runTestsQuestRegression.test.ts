import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');
const runTestsQuestPath = path.join(
    root,
    'frontend/src/pages/quests/json/welcome/run-tests.json'
);
const processesPath = path.join(root, 'frontend/src/pages/processes/base.json');
const itemsPath = path.join(root, 'frontend/src/pages/inventory/json/items/misc.json');

const RUN_TESTS_PROCESS_IDS = [
    'create-github-repo',
    'prepare-local-testbed',
    'execute-dspace-tests',
] as const;

const REQUIRED_REPORT_ITEM_ID = '1486e0df-f01e-4c9e-bdd8-ef272df0b9ef';
const REQUIRED_CHECKOUT_ITEM_ID = 'c4807e67-4e40-452f-8cdc-e326f3e34444';
const REQUIRED_REPO_ITEM_ID = '52593d07-908b-4109-92cf-826b2184ef6f';

type QuestOption = {
    type?: string;
    process?: string;
    requiresItems?: Array<{ id: string; count?: number }>;
};

type QuestNode = {
    id: string;
    text?: string;
    options?: QuestOption[];
};

type Quest = {
    id: string;
    dialogue?: QuestNode[];
};

describe('welcome/run-tests regression coverage', () => {
    const quest = JSON.parse(fs.readFileSync(runTestsQuestPath, 'utf8')) as Quest;
    const processes = JSON.parse(fs.readFileSync(processesPath, 'utf8')) as Array<any>;
    const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8')) as Array<any>;

    const processOptions = (quest.dialogue ?? [])
        .flatMap((node) => node.options ?? [])
        .filter((option) => option.type === 'process');

    const processIdsInQuest = new Set(processOptions.map((option) => option.process).filter(Boolean));
    const processById = new Map(processes.map((process) => [process.id, process]));

    it('keeps process steps wired into the quest so onboarding cannot silently lose them', () => {
        expect(processOptions.length).toBeGreaterThan(0);
        for (const processId of RUN_TESTS_PROCESS_IDS) {
            expect(processIdsInQuest.has(processId)).toBe(true);
        }
    });

    it('keeps required onboarding processes defined with expected output items', () => {
        for (const processId of RUN_TESTS_PROCESS_IDS) {
            expect(processById.has(processId)).toBe(true);
        }

        const prepareLocalTestbed = processById.get('prepare-local-testbed');
        expect(prepareLocalTestbed.createItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: REQUIRED_CHECKOUT_ITEM_ID, count: 1 }),
            ])
        );
        expect(prepareLocalTestbed.requireItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: REQUIRED_REPO_ITEM_ID, count: 1 }),
            ])
        );

        const executeDspaceTests = processById.get('execute-dspace-tests');
        expect(executeDspaceTests.createItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: REQUIRED_REPORT_ITEM_ID, count: 1 }),
            ])
        );
    });

    it('requires the local test report item before quest completion', () => {
        const finishNode = (quest.dialogue ?? []).find((node) => node.id === 'finish');
        expect(finishNode).toBeDefined();

        const finishOption = (finishNode?.options ?? []).find((option) => option.type === 'finish');
        expect(finishOption).toBeDefined();
        expect(finishOption?.requiresItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: REQUIRED_REPORT_ITEM_ID, count: 1 }),
            ])
        );
    });

    it('keeps the local test report item available in inventory definitions', () => {
        const reportItem = items.find((item) => item.id === REQUIRED_REPORT_ITEM_ID);
        expect(reportItem).toBeDefined();
        expect(reportItem.name).toBe('local test report');
    });
});
