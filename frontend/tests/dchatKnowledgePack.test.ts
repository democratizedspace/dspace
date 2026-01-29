import { describe, expect, it } from 'vitest';
import items from '../src/pages/inventory/json/items/index.js';
import { buildDchatKnowledgePack } from '../src/utils/dchatKnowledge.js';

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
});
