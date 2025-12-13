const {
    shuffleArray,
    generateRandomString,
    getQuestPossibleChoices,
    getQuestByID,
} = require('../src/utils.js');

describe('shuffleArray', () => {
    test('shuffles array deterministically', () => {
        const randomMock = jest
            .spyOn(Math, 'random')
            .mockReturnValueOnce(0.3)
            .mockReturnValueOnce(0.7)
            .mockReturnValueOnce(0.2);
        const result = shuffleArray([1, 2, 3, 4]);
        expect(result).toEqual([4, 1, 3, 2]);
        randomMock.mockRestore();
    });
});

describe('generateRandomString', () => {
    test('generates string of given length', () => {
        const randomMock = jest
            .spyOn(Math, 'random')
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(1 / 62)
            .mockReturnValueOnce(2 / 62);
        const result = generateRandomString(3);
        expect(result).toBe('ABC');
        randomMock.mockRestore();
    });
});

describe('quest helper functions', () => {
    test('getQuestPossibleChoices collects goto options', () => {
        const quest = {
            quest: [
                { name: 'start', goto: { options: ['a', 'b'] } },
                { name: 'middle', goto: { options: ['c'] } },
                { name: 'end' },
            ],
        };
        expect(getQuestPossibleChoices(quest)).toEqual({
            start: ['a', 'b'],
            middle: ['c'],
        });
    });

    test('getQuestByID returns quest or null', () => {
        const quests = [
            { id: '1', title: 'First' },
            { id: '2', title: 'Second' },
        ];
        expect(getQuestByID('2', quests)).toEqual(quests[1]);
        expect(getQuestByID('3', quests)).toBeNull();
        expect(getQuestByID('1', null)).toBeNull();
    });
});
