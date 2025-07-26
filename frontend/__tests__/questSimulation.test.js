/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const { questHasFinishPath } = require('../src/utils/simulateQuest.js');

const questFile = path.join(__dirname, '../test-data/simple-quest.json');
const loopQuestFile = path.join(__dirname, '../test-data/loop-quest.json');
const loopFinishQuestFile = path.join(__dirname, '../test-data/loop-finish-quest.json');

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
});
