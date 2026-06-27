import { describe, expect, it } from 'vitest';
import { buildFocusedGameDataContext } from '../src/utils/gameDataRetrieval.js';

describe('buildFocusedGameDataContext', () => {
    it('selects green PLA item and owned state', () => {
        const result = buildFocusedGameDataContext({
            query: 'do I have enough green PLA?',
            gameState: { inventory: { 'd3590107-25ff-4de5-af3a-46e2497bfc52': 13 } },
        });

        expect(result.block).toContain('Relevant inventory:');
        expect(result.block).toContain('green PLA filament');
        expect(result.sources.some((source) => source.type === 'item')).toBe(true);
        expect(result.meta.selectedInventoryIds).toContain('d3590107-25ff-4de5-af3a-46e2497bfc52');
    });

    it('selects rocket and Benchy process data', () => {
        const result = buildFocusedGameDataContext({
            query: "I'd like to make a 3D printed rocket and 10 benchies. Is it enough for that?",
            gameState: { inventory: { 'd3590107-25ff-4de5-af3a-46e2497bfc52': 250 } },
        });

        expect(result.block).toContain('Relevant processes:');
        expect(result.block).toMatch(/rocket/i);
        expect(result.block).toMatch(/Benchy/i);
        expect(result.block).toMatch(/Consumes:/);
    });

    it('selects a preflight quest and reward data', () => {
        const result = buildFocusedGameDataContext({
            query: 'what rewards does preflight check give?',
        });

        expect(result.block).toContain('Relevant quests:');
        expect(result.block).toMatch(/preflight/i);
        expect(result.sources.some((source) => source.type === 'quest')).toBe(true);
    });

    it('uses prior process context for vague consume follow-ups', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does it consume?',
            messages: [{ role: 'user', content: 'Tell me about 3D print a 100 mm model rocket' }],
        });

        expect(result.block).toContain('Relevant processes:');
        expect(result.block).toContain('3dprint-rocket');
        expect(result.meta.reasonCodes).toContain('recent-context-expanded');
    });

    it('does not select broad catalog filler for unrelated queries and enforces budgets', () => {
        const result = buildFocusedGameDataContext({
            query: 'tell me a joke about clouds',
            options: { maxTotalChars: 500, maxItems: 1, maxQuests: 1, maxProcesses: 1 },
        });

        expect(result.block.length).toBeLessThanOrEqual(500);
        expect(result.meta.selectedItemCount).toBeLessThanOrEqual(1);
        expect(result.meta.selectedQuestCount).toBeLessThanOrEqual(1);
        expect(result.meta.selectedProcessCount).toBeLessThanOrEqual(1);
    });
});
