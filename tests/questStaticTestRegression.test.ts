import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

type QuestOption = {
    type?: string;
    process?: string;
    goto?: string;
    requiresItems?: Array<{ id: string; count: number }>;
};

type QuestNode = {
    id?: string;
    options?: QuestOption[];
};

type Quest = {
    id: string;
    dialogue?: QuestNode[];
};

type ProcessDef = {
    id: string;
    requireItems?: Array<{ id: string; count: number }>;
    createItems?: Array<{ id: string; count: number }>;
};

const ASSEMBLED_ROCKET_WITH_PARACHUTE_ID = 'e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec';
const STATIC_ENGINE_THRUST_LOG_ID = '4d5d0f2e-77e7-44c2-a0d7-ef0f9f8a9b2d';
const GENERIC_PROCESS_COMPLETION_NOTE_ID = '36af76d6-2f90-4c6e-98c7-44bf64aadb96';
const PARACHUTE_ID = '80a83ecc-bcd2-400e-a469-8488a6453bb8';

const questPath = 'frontend/src/pages/quests/json/rocketry/static-test.json';
const processPath = 'frontend/src/pages/processes/base.json';

describe('rocketry static-test regressions', () => {
    it('requires explicit goto progression after process completion at burn', async () => {
        const quest = JSON.parse(await readFile(questPath, 'utf8')) as Quest;
        const burn = (quest.dialogue ?? []).find((node) => node.id === 'burn');
        expect(burn).toBeDefined();

        const processOption = (burn?.options ?? []).find((option) => option.type === 'process');
        expect(processOption?.process).toBe('run-static-engine-test');
        expect(processOption).not.toHaveProperty('goto');
        expect(processOption).not.toHaveProperty('requiresItems');

        const interpretGoto = (burn?.options ?? []).find(
            (option) => option.type === 'goto' && option.goto === 'interpret'
        );
        expect(interpretGoto?.requiresItems).toEqual([{ id: STATIC_ENGINE_THRUST_LOG_ID, count: 1 }]);
    });

    it('keeps static-test process gating specific to the prerequisite output and test proof', async () => {
        const processes = JSON.parse(await readFile(processPath, 'utf8')) as ProcessDef[];
        const staticTestProcess = processes.find((process) => process.id === 'run-static-engine-test');

        expect(staticTestProcess).toBeDefined();
        expect(staticTestProcess?.requireItems).toEqual([{ id: ASSEMBLED_ROCKET_WITH_PARACHUTE_ID, count: 1 }]);
        expect(staticTestProcess?.requireItems).not.toContainEqual({ id: PARACHUTE_ID, count: 1 });

        expect(staticTestProcess?.createItems).toEqual([{ id: STATIC_ENGINE_THRUST_LOG_ID, count: 1 }]);
        expect(staticTestProcess?.createItems).not.toContainEqual({ id: GENERIC_PROCESS_COMPLETION_NOTE_ID, count: 1 });
    });
});

