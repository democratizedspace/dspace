const { buildFocusedGameDataContext } = require('../src/utils/gameDataRetrieval.js');

const GREEN_PLA_ID = 'd3590107-25ff-4de5-af3a-46e2497bfc52';

describe('buildFocusedGameDataContext', () => {
    test('green PLA selects matching item and owned inventory', () => {
        const result = buildFocusedGameDataContext({
            query: 'do I have enough green PLA?',
            gameState: { inventory: { [GREEN_PLA_ID]: 12 } },
        });
        expect(result.block).toContain('Relevant inventory');
        expect(result.block).toMatch(/green PLA/i);
        expect(result.meta.selectedItemIds).toContain(GREEN_PLA_ID);
    });

    test('3D printed rocket and 10 benchies selects relevant process data', () => {
        const result = buildFocusedGameDataContext({
            query: "I'd like to make a 3D printed rocket and 10 benchies. Is it enough for that?",
            gameState: { inventory: { [GREEN_PLA_ID]: 99 } },
        });
        expect(result.block).toMatch(/Benchy/i);
        expect(result.block).toMatch(/rocket/i);
        expect(result.block).toMatch(/consumes|requires|creates/i);
        expect(result.meta.selectedProcessCount).toBeGreaterThan(0);
    });

    test('preflight check rewards selects matching quest without broad filler', () => {
        const result = buildFocusedGameDataContext({
            query: 'what rewards does preflight check give?',
        });
        expect(result.block).toMatch(/Preflight Checklist/i);
        expect(result.meta.selectedQuestIds).toContain('rocketry/preflight-check');
        expect(
            result.sources.filter((source) => source.type === 'quest').length
        ).toBeLessThanOrEqual(6);
    });

    test('process consume with prior process context selects that process', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does it consume?',
            messages: [
                {
                    role: 'user',
                    content: 'Tell me about 3D print a 60 mm Benchy calibration model',
                },
            ],
        });
        expect(result.meta.selectedProcessIds).toContain('3dprint-benchy');
        expect(result.block).toMatch(/Relevant processes/);
    });

    test('unrelated query does not dump broad catalog filler', () => {
        const result = buildFocusedGameDataContext({ query: 'tell me a joke about socks' });
        expect(result.meta.selectedItemCount).toBeLessThanOrEqual(1);
        expect(result.meta.selectedQuestCount).toBe(0);
        expect(result.meta.selectedProcessCount).toBe(0);
        expect(result.block.length).toBeLessThan(1000);
    });

    test('budgets and caps are enforced', () => {
        const result = buildFocusedGameDataContext({
            query: 'rocket pla print quest process item achievement inventory rewards consumes creates',
            options: {
                maxItems: 2,
                maxQuests: 2,
                maxProcesses: 2,
                maxAchievements: 1,
                maxTotalChars: 500,
            },
        });
        expect(result.meta.selectedItemCount).toBeLessThanOrEqual(2);
        expect(result.meta.selectedQuestCount).toBeLessThanOrEqual(2);
        expect(result.meta.selectedProcessCount).toBeLessThanOrEqual(2);
        expect(result.block.length).toBeLessThanOrEqual(500);
    });
});
