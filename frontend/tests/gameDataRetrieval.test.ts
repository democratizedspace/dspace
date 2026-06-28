import { describe, expect, it } from 'vitest';
import { buildPromptMetrics } from '../src/utils/promptMetrics.js';
import { buildFocusedGameDataContext, __testables } from '../src/utils/gameDataRetrieval.js';

describe('buildFocusedGameDataContext', () => {
    it('normalizes punctuation, hyphenation, plurals, and DSPACE resource tokens', () => {
        const { normalize, tokensFor } = __testables();

        expect(normalize('d-Solar / d_Watt, GREEN-PLAs')).toContain('dsolar');
        expect(tokensFor('BENCHIES and rockets')).toEqual(
            expect.arrayContaining(['benchy', 'rocket'])
        );
        expect(tokensFor('dPrint dLaunch dWatt dSolar')).toEqual(
            expect.arrayContaining(['dprint', 'dlaunch', 'dwatt', 'dsolar'])
        );
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
        expect(result.meta.reasonCodes).toEqual(expect.arrayContaining(['direct-entity-hit']));
    });

    it('matches common aliases to bounded item and process entities', () => {
        const benchy = buildFocusedGameDataContext({ query: 'what process makes a benchy?' });
        const rocket = buildFocusedGameDataContext({ query: 'Can I craft a rocket?' });

        expect(benchy.meta.selectedProcessIds).toContain('3dprint-benchy');
        expect(benchy.meta.selectedItemIds).toContain('7892ffc6-c651-445f-946b-7edc998cf389');
        expect(rocket.meta.selectedProcessIds).toContain('3dprint-rocket');
        expect(rocket.meta.selectedItemIds).toContain('5322b85e-b47d-4ea4-b515-318f91abc7df');
    });

    it('matches process inputs and outputs by item names', () => {
        const result = buildFocusedGameDataContext({
            query: 'how do I get dLaunch?',
        });

        expect(result.block).toContain('Relevant processes:');
        expect(result.meta.selectedProcessIds).toContain('launch-rocket');
        expect(result.block).toContain('dLaunch');
        expect(result.meta.reasonCodes).toContain('resource-token-hit');
    });

    it('traverses from process to required, consumed, and created items without broad expansion', () => {
        const result = buildFocusedGameDataContext({
            query: 'what does 3dprint-benchy consume and create?',
            options: { maxItems: 8, maxProcesses: 1, maxQuests: 2 },
        });

        expect(result.meta.selectedProcessIds).toEqual(['3dprint-benchy']);
        expect(result.meta.selectedItemIds).toEqual(
            expect.arrayContaining([
                'd3590107-25ff-4de5-af3a-46e2497bfc52',
                '7892ffc6-c651-445f-946b-7edc998cf389',
            ])
        );
        expect(result.meta.selectedItemCount).toBeLessThanOrEqual(8);
        expect(result.block).toContain('Relevant relationships:');
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
