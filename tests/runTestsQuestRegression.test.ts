import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const runTestsQuestPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'quests',
    'json',
    'welcome',
    'run-tests.json'
);

const processesPath = join(process.cwd(), 'frontend', 'src', 'generated', 'processes.json');

const runTestsQuest = JSON.parse(readFileSync(runTestsQuestPath, 'utf8')) as {
    dialogue?: Array<{ options?: Array<{ type?: string; process?: string }> }>;
};

const processes = JSON.parse(readFileSync(processesPath, 'utf8')) as Array<{
    id: string;
    createItems?: Array<{ id: string; count: number }>;
}>;

describe('welcome/run-tests regression coverage', () => {
    it('keeps process steps in the quest dialogue', () => {
        const processOptions = (runTestsQuest.dialogue ?? [])
            .flatMap((node) => node.options ?? [])
            .filter((option) => option.type === 'process');

        expect(processOptions.length).toBeGreaterThan(0);

        const processIds = processOptions
            .map((option) => option.process)
            .filter((id): id is string => Boolean(id));

        expect(processIds).toEqual(
            expect.arrayContaining([
                'prepare-local-testbed',
                'execute-dspace-tests',
                'generate-dspace-test-report',
            ])
        );
    });

    it('keeps required run-tests processes producing expected artifacts', () => {
        const byId = new Map(processes.map((process) => [process.id, process]));

        const cloneStep = byId.get('prepare-local-testbed');
        expect(cloneStep).toBeTruthy();
        expect(cloneStep?.createItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'c4807e67-4e40-452f-8cdc-e326f3e34444', count: 1 }),
            ])
        );

        const suiteStep = byId.get('execute-dspace-tests');
        expect(suiteStep).toBeTruthy();
        expect(suiteStep?.createItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: '8df837c6-8e6e-4c4e-b5b9-9e01306c8887', count: 1 }),
            ])
        );

        const reportStep = byId.get('generate-dspace-test-report');
        expect(reportStep).toBeTruthy();
        expect(reportStep?.createItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: '1486e0df-f01e-4c9e-bdd8-ef272df0b9ef', count: 1 }),
            ])
        );
    });
});
