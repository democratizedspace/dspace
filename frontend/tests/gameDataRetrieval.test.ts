import { describe, expect, it } from 'vitest';
import { buildPromptMetrics } from '../src/utils/promptMetrics.js';
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

    it('includes bounded owned inventory for pure inventory requests', () => {
        const result = buildFocusedGameDataContext({
            query: 'what do I have?',
            gameState: {
                inventory: {
                    '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 3,
                    'd3590107-25ff-4de5-af3a-46e2497bfc52': 13,
                },
            },
        });

        expect(result.block).toContain('Relevant inventory:');
        expect(result.block).toContain('white PLA filament');
        expect(result.meta.selectedInventoryCount).toBe(2);
        expect(result.meta.selectedInventoryIds).toContain('58580f6f-f3be-4be0-80b9-f6f8bf0b05a6');
        expect(result.sources.some((source) => source.id === 'focused-inventory')).toBe(true);
    });

    it('keeps early-return meta shape stable', () => {
        const result = buildFocusedGameDataContext({ query: 'what is it?' });

        expect(result.meta).toMatchObject({
            selectedItemCount: 0,
            selectedQuestCount: 0,
            selectedProcessCount: 0,
            selectedAchievementCount: 0,
            selectedInventoryCount: 0,
            selectedItemIds: [],
            selectedQuestIds: [],
            selectedProcessIds: [],
            selectedAchievementIds: [],
            selectedInventoryIds: [],
        });
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

    it('matches process inputs and outputs by item names', () => {
        const result = buildFocusedGameDataContext({
            query: 'how do I get dLaunch?',
        });

        expect(result.block).toContain('Relevant processes:');
        expect(result.meta.selectedProcessIds).toContain('launch-rocket');
        expect(result.block).toContain('dLaunch');
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

    it('returns achievement state for direct achievement requests without unrelated filler', () => {
        const result = buildFocusedGameDataContext({
            query: 'what achievements have I unlocked?',
            gameState: {
                quests: {
                    'welcome/howtodoquests': { finished: true },
                },
            },
        });

        expect(result.block).toContain('Relevant achievements:');
        expect(result.meta.selectedAchievementCount).toBeGreaterThan(0);
        expect(result.meta.reasonCodes).toContain('achievement-state-request');
    });

    it('does not fall back to achievement filler when no achievement intent exists', () => {
        const result = buildFocusedGameDataContext({
            query: 'what do I have?',
            gameState: {
                quests: {
                    'welcome/howtodoquests': { finished: true },
                },
                inventory: {},
            },
        });

        expect(result.block).not.toContain('Relevant achievements:');
        expect(result.meta.selectedAchievementCount).toBe(0);
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

    it('sanitizes focused game-data metrics values', () => {
        const metrics = buildPromptMetrics(
            { messages: [{ role: 'user', content: 'hello' }] },
            {
                contextPlan: {
                    focusedGameData: {
                        included: true,
                        reasonCodes: [{ reason: 'object' }],
                        selectedItemCount: '2',
                        selectedQuestCount: undefined,
                        selectedProcessCount: '3',
                        selectedAchievementCount: '1',
                        selectedInventoryCount: '4',
                        selectedItemIds: [1],
                        selectedQuestIds: ['quest'],
                        selectedProcessIds: ['process'],
                        selectedAchievementIds: [{ id: 'achievement' }],
                        selectedInventoryIds: [Symbol.for('item')],
                        renderedChars: '99',
                        caps: { maxItems: '8', maxQuests: undefined, maxProcesses: '6' },
                        truncated: true,
                    },
                },
            }
        );

        expect(metrics.focusedGameData).toMatchObject({
            reasonCodes: ['[object Object]'],
            selectedItemCount: 2,
            selectedQuestCount: 0,
            selectedProcessCount: 3,
            selectedAchievementIds: ['[object Object]'],
            selectedInventoryIds: ['Symbol(item)'],
            renderedChars: 99,
            caps: { maxItems: 8, maxQuests: 0, maxProcesses: 6 },
        });
    });
});
