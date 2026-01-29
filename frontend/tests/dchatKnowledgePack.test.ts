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
    it('returns summary and sources for non-empty catalogs', () => {
        const pack = buildDchatKnowledgePack({});

        expect(pack.summary).toContain('Items:');
        expect(pack.sources.length).toBeGreaterThan(0);
        expect(pack.sources.some((entry) => entry.type === 'item')).toBe(true);
        expect(pack.sources.some((entry) => entry.type === 'state')).toBe(false);
    });

    it('adds a state source when game state context is used', () => {
        const sampleItemId = items[0]?.id;
        const pack = buildDchatKnowledgePack({
            inventory: sampleItemId ? { [sampleItemId]: 1 } : {},
        });

        expect(pack.sources.some((entry) => entry.type === 'state')).toBe(true);
    });

    it('caps achievement sources to the configured limit', () => {
        const unlocked = Array.from({ length: 8 }, (_, index) => ({
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

        const pack = buildDchatKnowledgePack({});
        const achievementSources = pack.sources.filter((entry) => entry.type === 'achievement');

        expect(achievementSources.length).toBe(6);
        expect(achievementSources.map((entry) => entry.id)).toEqual(
            unlocked.slice(0, 6).map((entry) => entry.id)
        );
    });
});
