/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const globModule = require('glob');
const globSync = globModule.globSync || globModule.sync;
const {
    questHasFinishPath,
    getQuestSimulationSummary,
    questRequiresProcessOnAllFinishPaths,
} = require('../src/utils/simulateQuest.js');

const questFile = path.join(__dirname, '../test-data/constellations-quest.json');
const loopQuestFile = path.join(__dirname, '../test-data/loop-quest.json');
const loopFinishQuestFile = path.join(__dirname, '../test-data/loop-finish-quest.json');
const missingStartFile = path.join(__dirname, '../test-data/missing-start-quest.json');
const noDialogueFile = path.join(__dirname, '../test-data/no-dialogue-quest.json');
const githubFinishQuestFile = path.join(__dirname, '../test-data/github-finish-quest.json');

describe('Quest simulation', () => {
    test('sample quest has a path to finish', () => {
        const quest = JSON.parse(fs.readFileSync(questFile));
        expect(questHasFinishPath(quest)).toBe(true);
    });

    test('quest without finish path fails', () => {
        const quest = JSON.parse(fs.readFileSync(loopQuestFile));
        expect(questHasFinishPath(quest)).toBe(false);
    });

    test('quest with loops and finish still passes', () => {
        const quest = JSON.parse(fs.readFileSync(loopFinishQuestFile));
        expect(questHasFinishPath(quest)).toBe(true);
    });

    test('quest with missing start node fails', () => {
        const quest = JSON.parse(fs.readFileSync(missingStartFile));
        expect(questHasFinishPath(quest)).toBe(false);
    });

    test('quest without dialogue returns false', () => {
        const quest = JSON.parse(fs.readFileSync(noDialogueFile));
        expect(questHasFinishPath(quest)).toBe(false);
    });

    test('quest requiring GitHub token still has finish path', () => {
        const quest = JSON.parse(fs.readFileSync(githubFinishQuestFile));
        expect(questHasFinishPath(quest)).toBe(true);
    });

    test('process-path summary detects finish paths that skip processes', () => {
        const quest = {
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'start',
                    options: [
                        { type: 'goto', goto: 'finishNode', text: 'skip process' },
                        { type: 'goto', goto: 'processNode', text: 'take process route' },
                    ],
                },
                {
                    id: 'processNode',
                    text: 'processNode',
                    options: [
                        { type: 'process', process: 'example-process', text: 'run process' },
                        { type: 'goto', goto: 'finishNode', text: 'continue after process' },
                    ],
                },
                {
                    id: 'finishNode',
                    text: 'end',
                    options: [{ type: 'finish', text: 'finish' }],
                },
            ],
        };
        expect(questRequiresProcessOnAllFinishPaths(quest)).toBe(false);
    });

    test('process-path summary handles real process-plus-goto quest pattern', () => {
        const quest = {
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'start',
                    options: [
                        { type: 'process', process: 'example-process', text: 'run process' },
                        {
                            type: 'goto',
                            goto: 'middle',
                            text: 'process completed, continue',
                            requiresItems: [{ id: 'proof-item', count: 1 }],
                        },
                    ],
                },
                {
                    id: 'middle',
                    text: 'middle',
                    options: [{ type: 'finish', text: 'finish' }],
                },
            ],
        };
        expect(questRequiresProcessOnAllFinishPaths(quest)).toBe(true);
    });

    test('simulation summary reports missing start and unreachable nodes', () => {
        const quest = JSON.parse(fs.readFileSync(missingStartFile));
        const summary = getQuestSimulationSummary(quest);
        expect(summary.missingStart).toBe(true);
        expect(summary.unreachableNodes.length).toBeGreaterThan(0);
    });

    test('all canonical quests have a path to finish', () => {
        const questDir = path.join(__dirname, '../src/pages/quests/json');
        const files = globSync(path.join(questDir, '**/*.json'));
        files.forEach((file) => {
            const quest = JSON.parse(fs.readFileSync(file));
            expect(questHasFinishPath(quest)).toBe(true);
        });
    });
});
