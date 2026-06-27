import { describe, expect, it } from 'vitest';
import { buildFocusedGameDataContext } from '../src/utils/gameDataRetrieval.js';

const greenPlaId = 'd3590107-25ff-4de5-af3a-46e2497bfc52';

describe('buildFocusedGameDataContext', () => {
    it('selects green PLA item and owned state', () => {
        const result = buildFocusedGameDataContext({
            query: 'do I have enough green PLA?',
            gameState: { inventory: { [greenPlaId]: 42 } },
        });

        expect(result.block).toContain('Relevant inventory');
        expect(result.block).toContain('green PLA filament');
        expect(result.block).toContain('owned x42');
        expect(result.block).not.toContain('Relevant quests');
        expect(
            result.sources.some((source) => source.type === 'item' && source.id === greenPlaId)
        ).toBe(true);
    });

    it('selects rocket and Benchy process data with green PLA requirements', () => {
        const result = buildFocusedGameDataContext({
            query: "I'd like to make a 3D printed rocket and 10 benchies. Is it enough for that?",
            gameState: { inventory: { [greenPlaId]: 250 } },
        });

        expect(result.block).toContain('Relevant processes');
        expect(result.block).toContain('3D print a 100 mm model rocket');
        expect(result.block).toContain('Benchy calibration model');
        expect(result.block).toContain('consumes:');
        expect(result.block).toContain('green PLA filament');
    });

    it('selects matching quest reward data', () => {
        const result = buildFocusedGameDataContext({
            query: 'what rewards does preflight check give?',
        });

        expect(result.block).toContain('Relevant quests');
        expect(result.block.toLowerCase()).toContain('preflight');
        expect(result.block).toContain('Rewards:');
        expect(result.sources.some((source) => source.type === 'quest')).toBe(true);
    });

    it('uses recent process context for vague consume follow-up', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does it consume?',
            messages: [
                {
                    role: 'user',
                    content: 'Tell me about 3D print a 60 mm Benchy calibration model',
                },
                { role: 'assistant', content: 'The Benchy process is a 3D printing process.' },
                { role: 'user', content: 'what does it consume?' },
            ],
        });

        expect(result.block).toContain('Relevant processes');
        expect(result.block).toContain('3D print a 60 mm Benchy calibration model');
        expect(result.meta.reasonCodes).toContain('recent-context-used');
    });

    it('does not dump broad catalog filler for unrelated queries and enforces caps', () => {
        const result = buildFocusedGameDataContext({
            query: 'tell me a joke about clouds',
            options: { maxTotalChars: 120, maxItems: 1, maxQuests: 1, maxProcesses: 1 },
        });

        expect(result.block.length).toBeLessThanOrEqual(120);
        expect(result.meta.selectedItemCount).toBeLessThanOrEqual(1);
        expect(result.meta.selectedQuestCount).toBeLessThanOrEqual(1);
        expect(result.meta.selectedProcessCount).toBeLessThanOrEqual(1);
    });
});
