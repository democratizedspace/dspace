import { describe, expect, test } from 'vitest';

import { getBuiltInQuest } from '../src/utils/builtInQuests.js';

describe('getBuiltInQuest', () => {
    test('loads a known built-in quest with full dialogue data', () => {
        const quest = getBuiltInQuest('energy/solar');
        expect(quest).toBeTruthy();
        expect(quest).toHaveProperty('id', 'energy/solar');
        expect(Array.isArray(quest.dialogue)).toBe(true);
        expect(quest.dialogue.length).toBeGreaterThan(0);
    });

    test('returns null for unknown quest id', () => {
        expect(getBuiltInQuest('unknown/quest')).toBeNull();
    });
});
