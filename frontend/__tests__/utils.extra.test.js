jest.mock('../src/utils/gameState.js', () => ({
    questFinished: jest.fn(),
    canStartQuest: jest.fn(),
}));

const {
    getQuestCategory,
    getQuestCategories,
    filterQuests,
    getQuestsByCategory,
    getUrlSlug,
    getRandomId,
    getFileExtension,
    truncateString,
    formatCurrency,
    isArrayEqual,
    clamp,
    lerp,
    choice,
    getRandomInt,
    getRandomInts,
} = require('../src/utils.js');

const gameState = require('../src/utils/gameState.js');

describe('quest helper utilities', () => {
    const quests = [
        { id: '1', tags: ['aquaria'] },
        { id: '2', tags: ['electronics'] },
        { id: '3', tags: ['aquaria'] },
    ];

    test('getQuestCategory returns first tag or Unknown', () => {
        expect(getQuestCategory(quests[0])).toBe('aquaria');
        expect(getQuestCategory({})).toBe('Unknown');
    });

    test('getQuestCategories deduplicates categories', () => {
        expect(getQuestCategories(quests)).toEqual(['aquaria', 'electronics']);
    });

    test('getQuestsByCategory filters by category', () => {
        expect(getQuestsByCategory(quests, 'aquaria')).toHaveLength(2);
    });

    test('filterQuests respects finished status', () => {
        gameState.questFinished.mockImplementation((id) => id === '1');
        gameState.canStartQuest.mockReturnValue(true);

        expect(filterQuests(quests, 'available')).toEqual([quests[1], quests[2]]);
        expect(filterQuests(quests, 'finished')).toEqual([quests[0]]);
    });
});

describe('string and number utilities', () => {
    test('getUrlSlug converts text to slug', () => {
        expect(getUrlSlug('Hello World! 123')).toBe('hello-world-123');
    });

    test('getRandomId returns unique ids', () => {
        const a = getRandomId();
        const b = getRandomId();
        expect(a).not.toBe(b);
        expect(a).toHaveLength(9);
    });

    test('getFileExtension extracts extension', () => {
        expect(getFileExtension('image.png')).toBe('png');
    });

    test('truncateString shortens long text', () => {
        expect(truncateString('hello world', 5)).toBe('hel&hellip;');
    });

    test('formatCurrency formats numbers', () => {
        expect(formatCurrency(1234.5, '$')).toBe('$1,234.5');
    });

    test('isArrayEqual compares arrays', () => {
        expect(isArrayEqual([1, 2], [1, 2])).toBe(true);
        expect(isArrayEqual([1, 2], [2, 1])).toBe(false);
    });
});

describe('math helpers', () => {
    test('clamp limits numbers', () => {
        expect(clamp(0, 10, 15)).toBe(10);
    });

    test('lerp interpolates values', () => {
        expect(lerp(0, 10, 0.5)).toBe(5);
    });

    test('choice selects from array', () => {
        const arr = [1, 2, 3];
        expect(arr).toContain(choice(arr));
    });

    test('getRandomInt in range', () => {
        for (let i = 0; i < 5; i++) {
            const n = getRandomInt(1, 3);
            expect(n).toBeGreaterThanOrEqual(1);
            expect(n).toBeLessThanOrEqual(3);
        }
    });

    test('getRandomInts returns array of numbers', () => {
        const nums = getRandomInts(1, 5, 3);
        expect(nums).toHaveLength(3);
        nums.forEach((n) => {
            expect(n).toBeGreaterThanOrEqual(1);
            expect(n).toBeLessThanOrEqual(5);
        });
    });
});
