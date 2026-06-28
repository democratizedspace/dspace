import { describe, expect, it } from 'vitest';
import { buildPromptMetrics } from '../src/utils/promptMetrics.js';
import { buildFocusedGameDataContext } from '../src/utils/gameDataRetrieval.js';

import { __testables } from '../src/utils/gameDataRetrieval.js';

describe('buildFocusedGameDataContext', () => {
    it('normalizes aliases, resources, punctuation, hyphens, and plurals', () => {
        const { expandAliases, tokensFor } = __testables();

        expect(expandAliases('GREEN-PLA/benchies')).toContain('green pla filament');
        expect(tokensFor('dSolar, dWatt, dPrint and dLaunch')).toEqual(
            expect.arrayContaining(['solar', 'watt', 'print', 'launch'])
        );
        expect(tokensFor('BENCHIES')).toContain('benchy');
    });

    it('matches compact lowercase resource tokens and avoids small-alias substrings', () => {
        const { expandAliases, tokensFor } = __testables();

        expect(tokensFor('how much dsolar and dwatt do I have?')).toEqual(
            expect.arrayContaining(['solar', 'watt'])
        );
        expect(expandAliases('what quests are in the rocketry category?')).not.toContain(
            'model rocket'
        );
    });

    it('keeps verb tokens intact when singularizing plurals', () => {
        const { tokensFor } = __testables();

        expect(tokensFor('what process creates or requires boxes')).toEqual(
            expect.arrayContaining(['creates', 'requires', 'boxes', 'box'])
        );
        expect(tokensFor('what process creates or requires boxes')).not.toEqual(
            expect.arrayContaining(['creat', 'requir'])
        );
    });

    it('traverses from a created item to making processes', () => {
        const result = buildFocusedGameDataContext({
            query: 'What process makes a Benchy?',
            options: { maxProcesses: 3, maxItems: 5, maxTotalChars: 9000 },
        });

        expect(result.meta.selectedProcessIds).toContain('3dprint-benchy');
        expect(result.meta.reasonCodes).toContain('process-creates-match');
        expect(result.block).toContain('Relevant relationships:');
        expect(result.meta.selectedProcessCount).toBeLessThanOrEqual(3);
    });

    it('traverses from a process to required, consumed, and created items', () => {
        const result = buildFocusedGameDataContext({
            query: 'Can I make 3dprint-rocket?',
            gameState: { inventory: { 'd3590107-25ff-4de5-af3a-46e2497bfc52': 100 } },
        });

        expect(result.meta.selectedProcessIds).toContain('3dprint-rocket');
        expect(result.block).toContain('green PLA filament');
        expect(result.block).toContain('3D printed model rocket');
        expect(result.block).toContain('Consumes:');
    });

    it('selects quests that grant matched items through dialogue options', () => {
        const result = buildFocusedGameDataContext({
            query: 'what quest gives the NEMA 17 stepper motor pair?',
            options: { maxQuests: 6, maxItems: 6, maxTotalChars: 9000 },
        });

        expect(result.meta.selectedItemIds).toContain('648aee3c-907e-4cd1-a361-49c4bd771102');
        expect(result.meta.selectedQuestIds).toContain('energy/solar-tracker');
        expect(result.block).toContain('NEMA 17 stepper motor pair');
    });

    it('only emits traversal reason codes for entities kept within caps', () => {
        const result = buildFocusedGameDataContext({
            query: 'what process makes a Benchy?',
            options: { maxProcesses: 0, maxItems: 5, maxTotalChars: 9000 },
        });

        expect(result.meta.selectedProcessIds).toEqual([]);
        expect(result.meta.reasonCodes).not.toContain('process-creates-match');
    });

    it('selects resource token items and matching owned balances', () => {
        const result = buildFocusedGameDataContext({
            query: 'How much dSolar and dWatt do I have for dPrint or dLaunch?',
            gameState: {
                inventory: {
                    'b02ecff5-1f7d-4247-a09d-7d6cd6bb218a': 2,
                    '061fd221-404a-4bd1-9432-3e25b0f17a2c': 50,
                    '071ba424-3940-4c80-a782-5d7ea4d829ff': 7,
                    'eb9c2a75-a87a-4171-8bc3-088e75936bcf': 1,
                },
            },
        });

        expect(result.meta.reasonCodes).toContain('resource-token-hit');
        expect(result.block).toContain('dSolar');
        expect(result.block).toContain('dWatt');
        expect(result.block).toContain('dPrint');
        expect(result.block).toContain('dLaunch');
    });

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

    it('uses prior quest context for vague reward follow-ups', () => {
        const result = buildFocusedGameDataContext({
            query: 'what rewards does it give?',
            messages: [{ role: 'user', content: 'Tell me about Preflight Checklist' }],
        });

        expect(result.block).toContain('Relevant quests:');
        expect(result.meta.selectedQuestIds).toContain('rocketry/preflight-check');
        expect(result.block).toMatch(/Rewards:|Reward items:/);
        expect(result.block).not.toContain('Relevant processes:');
    });

    it('asks for clarification instead of dumping processes for ambiguous process follow-ups', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does this process consume?',
        });

        expect(result.block).toContain('no unambiguous process recovered from recent chat');
        expect(result.block).not.toMatch(/\|\||Requires:/);
        expect(result.meta.selectedProcessCount).toBe(0);
        expect(result.meta.reasonCodes).toContain('ambiguous-process-followup');
    });

    it('uses prior process context for vague consume follow-ups', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does it consume?',
            messages: [{ role: 'user', content: 'Tell me about 3D print a 100 mm model rocket' }],
        });

        expect(result.block).toContain('Relevant processes:');
        expect(result.block).toContain('3dprint-rocket');
        expect(result.meta.reasonCodes).toContain('followup-entity-carryover');
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
                        selectedItemIds: Array.from({ length: 20 }, (_, index) => index),
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
            selectedItemIds: Array.from({ length: 12 }, (_, index) => String(index)),
            selectedQuestCount: 0,
            selectedProcessCount: 3,
            selectedAchievementIds: ['[object Object]'],
            selectedInventoryIds: ['Symbol(item)'],
            renderedChars: 99,
            caps: { maxItems: 8, maxQuests: 0, maxProcesses: 6 },
        });
    });
});
