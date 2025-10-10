const { buildDchatKnowledge } = require('../src/utils/dchatKnowledge.js');

describe('buildDchatKnowledge', () => {
    test('includes inventory when available', () => {
        const gameState = {
            inventory: {
                '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 3,
            },
        };

        const knowledge = buildDchatKnowledge(gameState);
        expect(knowledge).toContain('Inventory highlights');
        expect(knowledge).toContain('white PLA filament');
    });

    test('includes quests and processes summary', () => {
        const knowledge = buildDchatKnowledge({});
        expect(knowledge).toContain('Quests:');
        expect(knowledge).toContain('Processes:');
    });

    test('includes essential tutorial quests', () => {
        const knowledge = buildDchatKnowledge({});
        expect(knowledge).toContain('How to do quests');
    });

    test('summarizes achievements progress', () => {
        const gameState = {
            quests: {
                'welcome/howtodoquests': { finished: true },
            },
        };

        const knowledge = buildDchatKnowledge(gameState);

        expect(knowledge).toContain('Achievements:');
        expect(knowledge).toMatch(/First Steps/);
    });
});
