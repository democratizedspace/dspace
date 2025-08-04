import { describe, it, expect } from 'vitest';
import { getQuestsForItem } from '../src/utils/itemDependencies.js';

const ASTRO_ITEM_ID = 'f439b57a-9df3-4bd9-9b6e-042476ceecf5';
const SOLAR_ITEM_ID = '02b32152-a7b2-458e-9643-7b754c722165';

describe('item dependency tracking', () => {
    it('returns quests that require an item', () => {
        const q = getQuestsForItem(ASTRO_ITEM_ID);
        expect(q.requires).toContain('astronomy/constellations');
    });

    it('returns quests that reward an item', () => {
        const q = getQuestsForItem(SOLAR_ITEM_ID);
        expect(q.rewards.length).toBeGreaterThan(0);
        expect(q.rewards).toContain('energy/dWatt-1e3');
    });

    it('returns empty arrays for unknown item', () => {
        const q = getQuestsForItem('nonexistent');
        expect(q).toEqual({ requires: [], rewards: [] });
    });
});
