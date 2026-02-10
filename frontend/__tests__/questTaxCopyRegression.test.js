/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');

describe('Quest tax copy regression', () => {
    test('welcome/smart-plug-test avoids fixed-deduction wording for dCarbon tax', () => {
        const questPath = path.join(
            __dirname,
            '../src/pages/quests/json/welcome/smart-plug-test.json'
        );
        const quest = JSON.parse(fs.readFileSync(questPath, 'utf8'));
        const dialogueText = quest.dialogue.map((node) => node.text).join(' ');

        expect(dialogueText).not.toMatch(/deducted from the sale value/i);
        expect(dialogueText).not.toMatch(/exact deduction/i);
        expect(dialogueText).toMatch(/tax rate scales/i);
        expect(dialogueText).toMatch(/dCarbon to dOffset/i);
    });
});
