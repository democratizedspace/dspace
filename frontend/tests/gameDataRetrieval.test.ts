import { describe, expect, it } from 'vitest';
import { buildFocusedGameDataContext } from '../src/utils/gameDataRetrieval.js';

const GREEN_PLA_ID = 'd3590107-25ff-4de5-af3a-46e2497bfc52';

describe('buildFocusedGameDataContext', () => {
    it('selects owned green PLA state and matching item context', () => {
        const result = buildFocusedGameDataContext({
            query: 'do I have enough green PLA?',
            gameState: { inventory: { [GREEN_PLA_ID]: 13 } },
        });

        expect(result.block).toContain('Relevant inventory:');
        expect(result.block).toContain('green PLA filament');
        expect(result.block).toContain('x13');
        expect(result.meta.selectedIds.items).toContain(GREEN_PLA_ID);
        expect(result.meta.counts.processes).toBe(0);
    });

    it('selects rocket and Benchy process data for a project comparison', () => {
        const result = buildFocusedGameDataContext({
            query: "I'd like to make a 3D printed rocket and 10 benchies. Is it enough for that?",
            gameState: { inventory: { [GREEN_PLA_ID]: 200 } },
        });

        expect(result.block).toContain('Relevant inventory:');
        expect(result.block).toMatch(/3D print a 100 mm model rocket/i);
        expect(result.block).toMatch(/Benchy/i);
        expect(result.block).toMatch(/Consumes:/);
        expect(result.meta.selectedIds.processes).toEqual(
            expect.arrayContaining(['3dprint-rocket', '3dprint-benchy'])
        );
    });

    it('selects preflight check quest and reward details', () => {
        const result = buildFocusedGameDataContext({
            query: 'what rewards does preflight check give?',
        });

        expect(result.block).toContain('Relevant quests:');
        expect(result.block).toContain('Preflight Checklist');
        expect(result.meta.selectedIds.quests).toContain('rocketry/preflight-check');
        expect(result.sources).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'quest', id: 'rocketry/preflight-check' }),
            ])
        );
    });

    it('uses previous process context for vague consume follow-ups', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does it consume?',
            messages: [
                {
                    role: 'user',
                    content: 'Tell me about the 3D print a 100 mm model rocket process.',
                },
                { role: 'assistant', content: 'It is a process for printing a model rocket.' },
                { role: 'user', content: 'what does it consume?' },
            ],
        });

        expect(result.block).toContain('Relevant processes:');
        expect(result.block).toMatch(/3D print a 100 mm model rocket/i);
        expect(result.meta.reasonCodes).toContain('recent-context-followup');
    });

    it('does not select broad catalog filler for unrelated turns', () => {
        const result = buildFocusedGameDataContext({ query: 'tell me a fun space joke' });

        expect(result.block).toBe('');
        expect(result.sources).toEqual([]);
        expect(result.meta.included).toBe(false);
    });

    it('enforces budgets and caps', () => {
        const result = buildFocusedGameDataContext({
            query: 'PLA printer rocket benchy preflight quest process inventory rewards consumes',
            gameState: { inventory: { [GREEN_PLA_ID]: 500 } },
            options: {
                maxItems: 2,
                maxQuests: 1,
                maxProcesses: 1,
                maxAchievements: 0,
                maxTotalChars: 500,
                maxSources: 4,
            },
        });

        expect(result.meta.counts.items).toBeLessThanOrEqual(2);
        expect(result.meta.counts.quests).toBeLessThanOrEqual(1);
        expect(result.meta.counts.processes).toBeLessThanOrEqual(1);
        expect(result.block.length).toBeLessThanOrEqual(500);
        expect(result.sources.length).toBeLessThanOrEqual(4);
    });
});
