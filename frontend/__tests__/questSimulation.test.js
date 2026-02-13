/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { questHasFinishPath, getQuestSimulationSummary } = require('../src/utils/simulateQuest.js');

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

    test('process options with goto metadata do not count as dialogue navigation', () => {
        const quest = {
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    options: [{ type: 'process', process: 'demo', goto: 'finish' }],
                },
                {
                    id: 'finish',
                    options: [{ type: 'finish', text: 'Done' }],
                },
            ],
        };

        expect(questHasFinishPath(quest)).toBe(false);
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
