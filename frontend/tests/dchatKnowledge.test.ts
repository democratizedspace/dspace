import { describe, expect, it } from 'vitest';
import items from '../src/pages/inventory/json/items/index.js';
import { buildDchatKnowledgePack } from '../src/utils/dchatKnowledge.js';

describe('buildDchatKnowledgePack', () => {
    it('returns a summary and sources for a populated game state', () => {
        const itemId = items[0]?.id ?? 'unknown-item';
        const pack = buildDchatKnowledgePack({
            inventory: { [itemId]: 2 },
            quests: { 'welcome/howtodoquests': { stepId: 1 } },
        });

        expect(pack.summary).toContain('Inventory highlights');
        expect(pack.sources.length).toBeGreaterThan(0);
        expect(pack.sources.some((source) => source.type === 'item')).toBe(true);
        expect(pack.sources.some((source) => source.type === 'process')).toBe(true);
        expect(pack.sources.some((source) => source.type === 'quest')).toBe(true);
        expect(pack.sources.some((source) => source.type === 'state')).toBe(true);
    });
});
