import { describe, it, expect } from 'vitest';
import { getQuestsForItem } from '../src/utils/itemDependencies.js';
import items from '../src/pages/inventory/json/items';

const getIdByName = (name) => items.find((item) => item.name === name)?.id;

describe('item dependency tracking', () => {
    it('returns quests that require an item', () => {
        const itemId = getIdByName('basic telescope');
        const q = getQuestsForItem(itemId);
        expect(q.requires).toContain('astronomy/constellations');
    });

    it('returns quests that reward an item', () => {
        const itemId = getIdByName('portable solar panel');
        const q = getQuestsForItem(itemId);
        expect(q.rewards.length).toBeGreaterThan(0);
        expect(q.rewards).toContain('energy/dWatt-1e3');
    });

    it('returns empty arrays for unknown item', () => {
        const q = getQuestsForItem('nonexistent');
        expect(q).toEqual({ requires: [], rewards: [] });
    });
});
