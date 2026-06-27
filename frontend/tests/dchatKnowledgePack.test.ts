import { beforeEach, describe, expect, it, vi } from 'vitest';
import items from '../src/pages/inventory/json/items/index.js';

const mockEvaluateAchievements = vi.fn();

vi.mock('../src/utils/achievements.js', () => ({
    evaluateAchievements: mockEvaluateAchievements,
}));

let buildDchatKnowledgePack;

beforeEach(async () => {
    if (!buildDchatKnowledgePack) {
        ({ buildDchatKnowledgePack } = await import('../src/utils/dchatKnowledge.js'));
    }
    mockEvaluateAchievements.mockReset().mockReturnValue([]);
});

describe('buildDchatKnowledgePack', () => {
    it('does not return broad catalog summaries without a focused query', () => {
        const pack = buildDchatKnowledgePack({});

        expect(pack.summary).not.toContain('Items:');
        expect(pack.summary).not.toContain('Quests:');
        expect(pack.summary).not.toContain('Processes:');
        expect(pack.sources.some((entry) => entry.type === 'item')).toBe(false);
        expect(pack.sources.some((entry) => entry.type === 'state')).toBe(false);
    });

    it('adds a state source when game state context is used', () => {
        const sampleItemId = items[0]?.id;
        const pack = buildDchatKnowledgePack(
            { inventory: sampleItemId ? { [sampleItemId]: 1 } : {} },
            { latestUserMessage: 'what is my inventory?' }
        );

        expect(pack.sources.some((entry) => entry.type === 'state')).toBe(true);
    });

    it('caps achievement sources to the configured limit', () => {
        const unlocked = Array.from({ length: 4 }, (_, index) => ({
            id: `unlocked-${index + 1}`,
            title: `Unlocked ${index + 1}`,
            unlocked: true,
        }));
        const inProgress = Array.from({ length: 5 }, (_, index) => ({
            id: `progress-${index + 1}`,
            title: `Progress ${index + 1}`,
            unlocked: false,
            progress: { percent: 25, displayValue: '25%' },
        }));

        mockEvaluateAchievements.mockReturnValue([...unlocked, ...inProgress]);

        const pack = buildDchatKnowledgePack({}, { latestUserMessage: 'Unlocked Progress' });
        const achievementSources = pack.sources.filter((entry) => entry.type === 'achievement');
        const expectedIds = inProgress.slice(0, 4).map((entry) => entry.id);
        const sortedAchievementIds = [...achievementSources]
            .sort((a, b) => {
                const labelCompare = a.label.localeCompare(b.label);
                if (labelCompare !== 0) {
                    return labelCompare;
                }
                return a.id.localeCompare(b.id);
            })
            .map((entry) => entry.id);

        expect(achievementSources.length).toBe(4);
        expect(achievementSources.map((entry) => entry.id)).toEqual(sortedAchievementIds);
        expect(new Set(achievementSources.map((entry) => entry.id))).toEqual(new Set(expectedIds));
    });

    it('bounds live-state inventory highlights instead of dumping all owned inventory', () => {
        const inventory = Object.fromEntries(
            Array.from({ length: 150 }, (_, index) => [`raw-owned-${index}`, index + 1])
        );
        const pack = buildDchatKnowledgePack(
            { inventory },
            { latestUserMessage: 'what is my inventory?' }
        );
        const highlights = pack.summary
            .split('\n\n')
            .find((section) => section.startsWith('Inventory highlights:'));

        expect(highlights).toContain('compact bounded live-state highlights');
        expect((highlights?.match(/raw-owned-/g) || []).length).toBeLessThanOrEqual(8);
        expect((pack.summary.match(/raw-owned-/g) || []).length).toBeLessThanOrEqual(8);
    });

    it('does not add arbitrary live inventory highlights for unrelated progress questions', () => {
        const pack = buildDchatKnowledgePack(
            { inventory: { '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 2 } },
            { latestUserMessage: 'How am I progressing?' }
        );

        const highlights = pack.summary
            .split('\n\n')
            .find((section) => section.startsWith('Inventory highlights:'));

        expect(highlights).toBeUndefined();
    });

    it('keeps resource balances in compact highlights for unrelated progress questions', () => {
        const pack = buildDchatKnowledgePack(
            { inventory: { '5247a603-294a-4a34-a884-1ae20969b2a1': 25 } },
            { latestUserMessage: 'How am I progressing?' }
        );

        const highlights = pack.summary
            .split('\n\n')
            .find((section) => section.startsWith('Inventory highlights:'));

        expect(highlights).toContain('compact bounded live-state highlights');
        expect(highlights).toContain('dUSD (x25)');
    });

    it('keeps query-relevant live inventory in compact highlights', () => {
        const pack = buildDchatKnowledgePack(
            { inventory: { 'd3590107-25ff-4de5-af3a-46e2497bfc52': 13 } },
            { latestUserMessage: 'do I have enough green PLA?' }
        );

        expect(pack.summary).toContain('Inventory highlights: compact bounded');
        expect(pack.summary).toContain('green PLA filament');
        expect(pack.summary).toContain('x13');
    });
});
