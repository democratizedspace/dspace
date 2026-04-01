/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const globModule = require('glob');
const { questHasFinishPath } = require('../src/utils/simulateQuest.js');
const { resolveGlobSync } = require('./helpers/resolveGlobSync');
const globSync = resolveGlobSync(globModule, 'questCanonical.test.js');

describe('Quest canonical structure', () => {
    const questDir = path.join(__dirname, '../src/pages/quests/json');
    const files = globSync(path.join(questDir, '**/*.json'));

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

            // Quests must expose at least one finish option somewhere in dialogue.
            const hasFinish = quest.dialogue.some(
                (node) =>
                    Array.isArray(node.options) &&
                    node.options.some((option) => option.type === 'finish')
            );
            expect(hasFinish).toBe(true);

            // Ensure a path exists from start to a finish option
            expect(questHasFinishPath(quest)).toBe(true);
        });
    });
});
