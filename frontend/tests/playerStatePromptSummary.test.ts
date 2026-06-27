import { describe, expect, it } from 'vitest';
import {
    buildPlayerStatePromptSummary,
    PLAYER_STATE_SUMMARY_LIMITS,
} from '../src/utils/playerStatePromptSummary.js';

const makeInventory = (count: number) =>
    Object.fromEntries(
        Array.from({ length: count }, (_, index) => [`uuid-item-${index}`, index + 1])
    );

describe('buildPlayerStatePromptSummary', () => {
    it('summarizes many finished quests with counts instead of a questsFinished array', () => {
        const summary = buildPlayerStatePromptSummary({
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
                'welcome/intro-inventory': { finished: true },
                'custom/very-long-finished': { finished: true },
            },
            inventory: {},
        });

        expect(summary.block).toContain('PlayerState compact summary v3');
        expect(summary.block).toContain('Official quests: completed');
        expect(summary.block).not.toContain('questsFinished');
        expect(summary.meta.playerStatePromptMode).toBe('compact');
        expect(summary.meta.completedQuestCount).toBeGreaterThanOrEqual(2);
    });

    it('includes remaining official quest IDs and titles up to the cap', () => {
        const summary = buildPlayerStatePromptSummary({
            versionNumberString: '3',
            quests: {},
            inventory: {},
        });

        expect(summary.slices?.remainingQuests.length).toBeLessThanOrEqual(
            PLAYER_STATE_SUMMARY_LIMITS.remainingQuestCap
        );
        expect(summary.block).toContain('Remaining official quests shown');
        expect(summary.meta.remainingQuestIncludedCount).toBe(
            summary.slices?.remainingQuests.length
        );
    });

    it('bounds inventory summaries and records truncation metadata', () => {
        const summary = buildPlayerStatePromptSummary(
            { versionNumberString: '3', quests: {}, inventory: makeInventory(30) },
            { latestUserMessage: 'what is my inventory?' }
        );

        expect(summary.block).toContain('Inventory: 30 owned item type(s).');
        expect(summary.block).toContain('Inventory details omitted/truncated');
        expect(summary.meta.inventoryTotalCount).toBe(30);
        expect(summary.meta.inventoryIncludedCount).toBeLessThanOrEqual(
            PLAYER_STATE_SUMMARY_LIMITS.relevantInventoryCap
        );
        expect(summary.meta.inventoryTruncated).toBe(true);
    });

    it('includes query-relevant green PLA and notable dSolar balances', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: {
                    'd3590107-25ff-4de5-af3a-46e2497bfc52': 42,
                    'b02ecff5-1f7d-4247-a09d-7d6cd6bb218a': 7,
                },
            },
            { latestUserMessage: 'do I have enough green PLA or dSolar?' }
        );

        expect(summary.block).toContain('green PLA filament (x42)');
        expect(summary.block).toContain('dSolar (x7)');
    });

    it('does not include arbitrary inventory details for unrelated state questions', () => {
        const summary = buildPlayerStatePromptSummary(
            { versionNumberString: '3', quests: {}, inventory: makeInventory(20) },
            { latestUserMessage: 'what quest do I have left?' }
        );

        expect(summary.meta.inventoryIncludedCount).toBe(0);
        expect(summary.block).not.toContain('uuid-item-');
        expect(summary.block).toContain('Omitted inventory/quest details are not evidence');
    });
});
