/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { questHasFinishPath } = require('../src/utils/simulateQuest.js');

describe('Quest canonical structure', () => {
    const questDir = path.join(__dirname, '../src/pages/quests/json');
    const files = glob.sync(path.join(questDir, '**/*.json'));

    files.forEach((file) => {
        const quest = JSON.parse(fs.readFileSync(file));
        const questName = path.relative(questDir, file);

        test(`${questName} follows canonical structure`, () => {
            const startId = quest.start || 'start';
            const startNode =
                quest.dialogue.find((n) => n.id === startId) ||
                quest.dialogue.find((n) => n.id === 'start');
            expect(startNode).toBeTruthy();
            expect(startNode.options && startNode.options.length > 0).toBe(true);

            // At least three dialogue nodes (start, middle, finish)
            expect(quest.dialogue.length).toBeGreaterThanOrEqual(3);

            // The final node must present a finish option
            const lastNode = quest.dialogue[quest.dialogue.length - 1];
            const hasFinish =
                Array.isArray(lastNode.options) &&
                lastNode.options.some((o) => o.type === 'finish');
            expect(hasFinish).toBe(true);

            // Ensure a path exists from start to a finish option
            expect(questHasFinishPath(quest)).toBe(true);
        });
    });
});
