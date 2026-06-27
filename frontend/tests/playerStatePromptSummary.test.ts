import { describe, expect, it } from 'vitest';
import { buildPlayerStatePromptSummary } from '../src/utils/playerStatePromptSummary.js';

const GREEN_PLA_ID = 'd3590107-25ff-4de5-af3a-46e2497bfc52';
const DSOLAR_ID = 'b02ecff5-1f7d-4247-a09d-7d6cd6bb218a';

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
