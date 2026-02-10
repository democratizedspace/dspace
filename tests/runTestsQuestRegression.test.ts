import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runTestsQuestPath = resolve(
    process.cwd(),
    'frontend/src/pages/quests/json/welcome/run-tests.json'
);

const loadRunTestsQuest = () =>
    JSON.parse(readFileSync(runTestsQuestPath, 'utf8')) as {
        dialogue?: Array<{ options?: Array<{ type?: string; process?: string; requiresItems?: any[] }> }>;
    };

const loadProcesses = () =>
    JSON.parse(
        readFileSync(resolve(process.cwd(), 'frontend/src/generated/processes.json'), 'utf8')
    ) as Array<{ id: string; title?: string; createItems?: any[] }>;
const processById = new Map(loadProcesses().map((process) => [process.id, process]));

describe('welcome/run-tests quest regression guards', () => {
    it('keeps non-empty process steps and references expected process ids', () => {
        const quest = loadRunTestsQuest();
        const processOptionIds = (quest.dialogue ?? []).flatMap((node) =>
            (node.options ?? [])
                .filter((option) => option.type === 'process' && typeof option.process === 'string')
                .map((option) => option.process as string)
        );

        expect(processOptionIds.length).toBeGreaterThan(0);
        expect(processOptionIds).toEqual(
            expect.arrayContaining([
                'create-github-repo',
                'prepare-local-testbed',
                'create-ci-workflow',
                'execute-dspace-tests',
            ])
        );

        processOptionIds.forEach((id) => {
            expect(processById.has(id)).toBe(true);
        });
    });

    it('keeps clone/setup and report-producing process definitions intact', () => {
        const cloneProcess = processById.get('prepare-local-testbed');
        const runTestsProcess = processById.get('execute-dspace-tests');

        expect(cloneProcess).toBeTruthy();
        expect(cloneProcess.title).toMatch(/git clone/i);
        expect(cloneProcess.title).toMatch(/pnpm install/i);
        expect(cloneProcess.createItems).toEqual(
            expect.arrayContaining([{ id: 'c4807e67-4e40-452f-8cdc-e326f3e34444', count: 1 }])
        );

        expect(runTestsProcess).toBeTruthy();
        expect(runTestsProcess.title).toMatch(/qa:smoke/i);
        expect(runTestsProcess.title).toMatch(/test:ci/i);
        expect(runTestsProcess.createItems).toEqual(
            expect.arrayContaining([{ id: '1486e0df-f01e-4c9e-bdd8-ef272df0b9ef', count: 1 }])
        );
    });

    it('requires the local test report item before finishing', () => {
        const quest = loadRunTestsQuest();
        const finishOptions = (quest.dialogue ?? []).flatMap((node) =>
            (node.options ?? []).filter((option) => option.type === 'finish')
        );

        expect(finishOptions.length).toBeGreaterThan(0);
        finishOptions.forEach((option) => {
            expect(option.requiresItems ?? []).toEqual(
                expect.arrayContaining([{ id: '1486e0df-f01e-4c9e-bdd8-ef272df0b9ef', count: 1 }])
            );
        });
    });
});
