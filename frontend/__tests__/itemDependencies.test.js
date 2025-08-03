import { describe, it, expect } from 'vitest';
import { getQuestsForItem } from '../src/utils/itemDependencies.js';
import idMap from '../../scripts/item-id-map.json' assert { type: 'json' };

describe('item dependency tracking', () => {
    it('returns quests that require an item', () => {
        const q = getQuestsForItem(idMap['134']);
        expect(q.requires).toContain('astronomy/constellations');
    });

    it('returns quests that reward an item', () => {
        const q = getQuestsForItem(idMap['5']);
        expect(q.rewards.length).toBeGreaterThan(0);
        expect(q.rewards).toContain('energy/dWatt-1e3');
    });

    it('returns empty arrays for unknown item', () => {
        const q = getQuestsForItem('nonexistent');
        expect(q).toEqual({ requires: [], rewards: [] });
    });
});
