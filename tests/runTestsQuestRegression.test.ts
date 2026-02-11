import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runTestsQuestPath = resolve(
    process.cwd(),
    'frontend/src/pages/quests/json/welcome/run-tests.json'
);

const loadRunTestsQuest = () =>
    JSON.parse(readFileSync(runTestsQuestPath, 'utf8')) as {
        dialogue?: Array<{ id?: string; options?: Array<{ type?: string; process?: string; requiresItems?: any[] }> }>;
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
        const finishNode = (quest.dialogue ?? []).find((node) => node.id === 'finish');
        const finishOption = (finishNode?.options ?? []).find((option) => option.type === 'finish');

        expect(finishNode).toBeTruthy();
        expect(finishOption).toBeTruthy();
        expect(finishOption?.requiresItems ?? []).toEqual(
            expect.arrayContaining([{ id: '1486e0df-f01e-4c9e-bdd8-ef272df0b9ef', count: 1 }])
        );
    });
});


describe('sysadmin quest regression guards', () => {
    const loadQuest = (slug: string) =>
        JSON.parse(
            readFileSync(
                resolve(process.cwd(), `frontend/src/pages/quests/json/${slug}.json`),
                'utf8'
            )
        ) as {
            rewards?: Array<{ id: string; count?: number }>;
            dialogue?: Array<{ id?: string; text?: string; options?: Array<{ type?: string; process?: string }> }>;
        };

    const processById = new Map(loadProcesses().map((process) => [process.id, process]));

    it('requires rewards and >=2 process hooks for each updated sysadmin quest', () => {
        const targets = [
            'sysadmin/basic-commands',
            'sysadmin/resource-monitoring',
            'sysadmin/log-analysis',
        ];

        targets.forEach((target) => {
            const quest = loadQuest(target);
            expect((quest.rewards ?? []).length).toBeGreaterThan(0);

            const processOptionIds = (quest.dialogue ?? []).flatMap((node) =>
                (node.options ?? [])
                    .filter((option) => option.type === 'process' && typeof option.process === 'string')
                    .map((option) => option.process as string)
            );

            expect(processOptionIds.length).toBeGreaterThanOrEqual(2);
            processOptionIds.forEach((id) => expect(processById.has(id)).toBe(true));
        });
    });

    it('keeps quiz depth for sysadmin quests (>=5 for basic commands)', () => {
        const minQuizByQuest: Record<string, number> = {
            'sysadmin/basic-commands': 5,
            'sysadmin/resource-monitoring': 5,
            'sysadmin/log-analysis': 5,
        };

        Object.entries(minQuizByQuest).forEach(([target, minQuiz]) => {
            const quest = loadQuest(target);
            const quizNodes = (quest.dialogue ?? []).filter(
                (node) => node.id?.startsWith('quiz-') || node.text?.toLowerCase().startsWith('quiz ')
            );
            expect(quizNodes.length).toBeGreaterThanOrEqual(minQuiz);
        });
    });
});
