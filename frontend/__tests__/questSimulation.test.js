/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const { questHasFinishPath } = require('../src/utils/simulateQuest.js');

const questFile = path.join(__dirname, '../test-data/simple-quest.json');

describe('Quest simulation', () => {
    test('sample quest has a path to finish', () => {
        const quest = JSON.parse(fs.readFileSync(questFile));
        expect(questHasFinishPath(quest)).toBe(true);
    });
});
