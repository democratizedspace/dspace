const fs = require('fs');
const path = require('path');

describe('smart-plug-test quest tax copy', () => {
    const questPath = path.join(
        __dirname,
        '../src/pages/quests/json/welcome/smart-plug-test.json'
    );

    test('avoids deprecated fixed-deduction wording for dCarbon tax', () => {
        const quest = JSON.parse(fs.readFileSync(questPath, 'utf8'));
        const dialogueText = quest.dialogue.map((node) => node.text).join(' ');

        expect(dialogueText).not.toMatch(/deducted from the sale value/i);
        expect(dialogueText).not.toMatch(/exact deduction/i);
        expect(dialogueText).toMatch(/Sell button and tax note/i);
    });
});
