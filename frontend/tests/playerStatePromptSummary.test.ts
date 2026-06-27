import { describe, expect, it } from 'vitest';
import { buildPlayerStatePromptSummary } from '../src/utils/playerStatePromptSummary.js';

const GREEN_PLA_ID = 'd3590107-25ff-4de5-af3a-46e2497bfc52';
const DSOLAR_ID = 'b02ecff5-1f7d-4247-a09d-7d6cd6bb218a';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const DBI_ID = '016d4758-d114-4e04-9e6a-853db93a2eee';

const makeState = (inventory = {}) => ({
    versionNumberString: '3',
    quests: {
        'welcome/howtodoquests': { finished: true },
        'welcome/intro-inventory': { finished: true },
        'custom/not-official': { finished: true },
    },
    inventory,
    processes: {},
});

describe('buildPlayerStatePromptSummary', () => {
    it('keeps questsFinishedCount in compact and missing-state metadata for debug consumers', () => {
        const compact = buildPlayerStatePromptSummary(makeState());
        const raw = buildPlayerStatePromptSummary(makeState(), { playerStatePromptMode: 'raw' });
        const missing = buildPlayerStatePromptSummary(null);

        expect(compact.meta.questsFinishedCount).toBe(3);
        expect(compact.meta.playerStatePromptMode).toBe('compact');
        expect(raw.meta.questsFinishedCount).toBe(3);
        expect(raw.meta.playerStatePromptMode).toBe('raw');
        expect(missing.meta.questsFinishedCount).toBe(0);
        expect(missing.meta.playerStatePromptMode).toBe('none');
        expect(compact.block).not.toContain('questsFinished');
        expect(raw.block).toContain('questsFinished');
    });

    it('excludes elapsed completed processes from active process counts', () => {
        const result = buildPlayerStatePromptSummary({
            ...makeState(),
            processes: {
                elapsed: {
                    startedAt: Date.now() - 2_000,
                    duration: 1_000,
                    finished: false,
                    pausedAt: null,
                    elapsedBeforePause: 0,
                    pauseModelVersion: 2,
                },
                running: {
                    startedAt: Date.now(),
                    duration: 60_000,
                    finished: false,
                    pausedAt: null,
                    elapsedBeforePause: 0,
                    pauseModelVersion: 2,
                },
            },
        });

        expect(result.block).toContain('Active processes: 1 total');
        expect(result.slices.activeProcesses).toEqual([
            expect.objectContaining({ id: 'running', status: 'running' }),
        ]);
        expect(result.meta.activeProcessIncludedCount).toBe(1);
    });

    it('keeps broad inventory samples independent from query relevance slots', () => {
        const inventory = {
            [GREEN_PLA_ID]: 42,
            'item-1': 1,
            'item-2': 2,
        };
        const result = buildPlayerStatePromptSummary(makeState(inventory), {
            latestUserMessage: 'what items do I have with green PLA?',
            inventoryRelevantCap: 1,
            inventorySampleCap: 2,
        });

        expect(result.slices.relevantInventory).toHaveLength(3);
        expect(result.slices.relevantInventory[0].id).toBe(GREEN_PLA_ID);
        expect(result.meta.inventoryIncludedCount).toBe(3);
    });

    it('summarizes many finished quests with counts instead of a full questsFinished array', () => {
        const result = buildPlayerStatePromptSummary(makeState());

        expect(result.block).toContain('PlayerStateCompact v3');
        expect(result.block).toContain('Official quests: completed');
        expect(result.block).not.toContain('questsFinished');
        expect(result.block).not.toContain('custom/not-official');
        expect(result.meta.completedQuestCount).toBe(2);
        expect(result.meta.remainingQuestIncludedCount).toBeGreaterThan(0);
    });

    it('bounds remaining official quests and includes omission guidance', () => {
        const result = buildPlayerStatePromptSummary(makeState(), { remainingQuestCap: 2 });

        expect(result.meta.remainingQuestIncludedCount).toBeLessThanOrEqual(2);
        expect(result.block).toContain('Remaining official quests shown (cap 2)');
        expect(result.block).toContain('Omitted inventory/quest details are not evidence');
    });

    it('does not dump UUID-heavy inventory by default', () => {
        const inventory = Object.fromEntries(
            Array.from({ length: 60 }, (_, index) => [
                `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
                index + 1,
            ])
        );
        const result = buildPlayerStatePromptSummary(makeState(inventory), {
            latestUserMessage: 'what quest do I have left?',
        });

        expect(result.meta.inventoryTotalCount).toBe(60);
        expect(result.meta.inventoryIncludedCount).toBe(0);
        expect(result.meta.inventoryTruncated).toBe(true);
        expect((result.block.match(/00000000-0000-4000-8000/g) || []).length).toBe(0);
    });

    it('includes query-relevant green PLA when asked', () => {
        const result = buildPlayerStatePromptSummary(makeState({ [GREEN_PLA_ID]: 42 }), {
            latestUserMessage: 'do I have enough green PLA?',
        });

        expect(result.block).toContain('green PLA filament');
        expect(result.block).toContain('42');
        expect(result.meta.inventoryIncludedCount).toBe(1);
    });

    it('includes notable dSolar balances when present', () => {
        const result = buildPlayerStatePromptSummary(makeState({ [DSOLAR_ID]: 7 }), {
            latestUserMessage: 'dSolar',
        });

        expect(result.block).toContain('dSolar=7');
        expect(result.meta.inventoryIncludedCount).toBe(1);
    });

    it('bounds notable resource balances with a named cap', () => {
        const result = buildPlayerStatePromptSummary(
            makeState({
                [DSOLAR_ID]: 7,
                [DUSD_ID]: 20,
                [DBI_ID]: 3,
            }),
            { notableBalanceCap: 2 }
        );

        expect(result.slices.resourceBalances).toHaveLength(2);
        expect(result.slices.resourceBalances.map((entry) => entry.name)).toEqual([
            'dBI',
            'dSolar',
        ]);
        expect(result.meta.inventoryTotalCount).toBe(3);
        expect(result.meta.inventoryIncludedCount).toBe(2);
        expect(result.meta.inventoryTruncated).toBe(true);
        expect(result.block).toContain('Notable balances (cap 2): dBI=3, dSolar=7.');
        expect(result.block).not.toContain('dUSD=20');
    });

    it('shows a bounded inventory sample for broad inventory questions', () => {
        const inventory = Object.fromEntries(
            Array.from({ length: 20 }, (_, index) => [`item-${index}`, index + 1])
        );
        const result = buildPlayerStatePromptSummary(makeState(inventory), {
            latestUserMessage: 'what is my inventory?',
            inventorySampleCap: 4,
            inventoryRelevantCap: 4,
        });

        expect(result.meta.inventoryTotalCount).toBe(20);
        expect(result.meta.inventoryIncludedCount).toBe(4);
        expect(result.meta.inventoryTruncated).toBe(true);
        expect(result.slices.relevantInventory).toHaveLength(4);
    });
});
